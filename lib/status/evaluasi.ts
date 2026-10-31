import type { StatusAnak } from "@/lib/kontrak/api";
import { db } from "@/lib/server/supabase";
import { awalHariWib, tanggalWib } from "@/lib/server/waktu";
import { FAKTA_KOSONG, tentukanStatus, type Fakta } from "./aturan";
import { lebihTinggi, naikkanStatus } from "./naikkan";

// Mengumpulkan fakta satu anak dari database sejak sesi terakhir, lalu menaikkan status bila aturan menuntut.

export async function kumpulkanFakta(anakId: string): Promise<Fakta> {
  const [{ data: anak }, { data: sesi }] = await Promise.all([
    db().from("anak").select("pendengaran, hari_sesi").eq("id", anakId).single(),
    db().from("catatan_sesi").select("dibuat").eq("anak_id", anakId).order("dibuat", { ascending: false }).limit(1).maybeSingle(),
  ]);
  // Pemicu dihitung sejak sesi terakhir (terapis sudah membahas yang sebelumnya), paling jauh 28 hari.
  const sejak = sesi?.dibuat ?? awalHariWib(tanggalWib(28));
  const sejakTanggal = tanggalWib(0, new Date(sejak));

  const [laporan, rekaman, kegiatan, anggotaBaru] = await Promise.all([
    db().from("laporan_keluarga").select("tanggal, regresi, lebih_sedikit_bersuara, kata_baru").eq("anak_id", anakId).gte("tanggal", tanggalWib(28)).order("tanggal", { ascending: false }),
    db().from("rekaman").select("status, kurang_tepat, dibuat, hasil:hasil_rekaman (hasil)").eq("anak_id", anakId).gte("dibuat", sejak).order("dibuat", { ascending: false }),
    db().from("log_aktivitas").select("tanggal, anggota:anggota_id!inner (anak_id)").eq("anggota.anak_id", anakId).order("tanggal", { ascending: false }).limit(1),
    db().from("anggota").select("nama, peran, dibuat").eq("anak_id", anakId).order("dibuat"),
  ]);

  const lap = laporan.data ?? [];
  const lapSejakSesi = lap.filter((l) => l.tanggal >= sejakTanggal);
  const rek = rekaman.data ?? [];

  // Lebih sedikit bersuara: hitung hari berturut-turut terakhir yang dilaporkan begitu.
  let berturut = 0;
  for (const l of [...new Map(lap.map((l) => [l.tanggal, l])).values()]) {
    if (l.lebih_sedikit_bersuara) berturut++;
    else break;
  }

  // Minggu tanpa kata baru: berapa minggu sejak kata baru terakhir dilaporkan (hanya bila ada riwayat laporan).
  const kataTerakhir = lap.find((l) => (l.kata_baru ?? []).length > 0)?.tanggal;
  const mingguTanpaKata = lap.length === 0 ? 0 : kataTerakhir ? Math.floor((Date.parse(tanggalWib()) - Date.parse(kataTerakhir)) / (7 * 86_400_000)) : 4;

  let ditolak = 0;
  for (const r of rek.filter((r) => r.status !== "antre")) {
    if (r.status === "ditolak") ditolak++;
    else break;
  }

  // Hari aktif terakhir = log aktivitas, rekaman, atau laporan terbaru.
  const kandidatAktif = [
    (kegiatan.data ?? [])[0]?.tanggal as string | undefined,
    lap[0]?.tanggal,
    rek[0] ? tanggalWib(0, new Date(rek[0].dibuat)) : undefined,
  ].filter((x): x is string => !!x);
  const terakhirAktif = kandidatAktif.sort().at(-1) ?? null;
  const hariTidakAktif = terakhirAktif ? Math.floor((Date.parse(tanggalWib()) - Date.parse(terakhirAktif)) / 86_400_000) : 0;

  // Perubahan baru = anggota yang bergabung sejak sesi terakhir, minimal sehari setelah anggota pertama
  // (anggota yang bergabung bersamaan di hari pertama bukan perubahan).
  const semuaAnggota = anggotaBaru.data ?? [];
  const pertama = semuaAnggota[0] ? Date.parse(semuaAnggota[0].dibuat) : 0;
  const baru = semuaAnggota.find((a) => Date.parse(a.dibuat) >= Date.parse(sejak) && Date.parse(a.dibuat) - pertama >= 86_400_000);
  return {
    ...FAKTA_KOSONG,
    regresi: lapSejakSesi.some((l) => l.regresi),
    tidak_aktif_dua_sesi: hariTidakAktif >= 14,
    perubahan_baru: baru ? `Pengasuh baru: ${baru.nama}` : null,
    pendengaran_belum_diperiksa: anak?.pendengaran === "belum_diperiksa" || anak?.pendengaran == null,
    hari_tidak_aktif: hariTidakAktif,
    minggu_tanpa_kata_baru: mingguTanpaKata,
    hari_berturut_lebih_sedikit_bersuara: berturut,
    ditolak_berturut: ditolak,
    kurang_tepat_7_hari: rek.some((r) => r.kurang_tepat && Date.parse(r.dibuat) >= Date.now() - 7 * 86_400_000),
    ai_ragu: rek.some((r) => {
      const h = Array.isArray(r.hasil) ? r.hasil[0] : r.hasil;
      return (h?.hasil as { naikkan_status?: boolean } | undefined)?.naikkan_status === true;
    }),
  };
}

/** Evaluasi ulang status; hanya bisa menaikkan. Mengembalikan status baru bila naik, selain itu null. */
export async function evaluasiStatus(anakId: string): Promise<StatusAnak | null> {
  const fakta = await kumpulkanFakta(anakId);
  const { status, pemicu } = tentukanStatus(fakta);
  if (status === "lanjut" || !pemicu) return null;
  const { data } = await db().from("anak").select("status").eq("id", anakId).single();
  if (!data || !lebihTinggi(status, data.status as StatusAnak)) return null;
  return (await naikkanStatus(anakId, status, pemicu)) ? status : null;
}
