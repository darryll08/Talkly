import { denganAkses } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";
import { anakRingkas, anggotaUntukLayar } from "@/lib/keluarga/anggota";
import { hariAktif, itemRencana, kataUntuk, rencanaAktif, seninWib, tanggalWib } from "@/lib/keluarga/aktivitas";

// O3 Hari ini: pesan terapis, aktivitas hari ini untuk anggota ini, hari aktif, dan kabar keluarga (pengelola).

export const GET = denganAkses(["anggota"], async (_req, { saya }) => {
  const a = saya.anggota;
  const hariIni = tanggalWib();
  const senin = seninWib();
  const [anak, rencana, aktif] = await Promise.all([anakRingkas(a.anak_id), rencanaAktif(a.anak_id), hariAktif(a.id, senin)]);

  const item = rencana ? await itemRencana(rencana.id, a) : [];
  const { data: log } = item.length
    ? await db()
        .from("log_aktivitas")
        .select("rencana_item_id")
        .eq("anggota_id", a.id)
        .eq("tanggal", hariIni)
        .in("rencana_item_id", item.map((i) => i.item_id))
    : { data: [] };
  const selesai = new Set((log ?? []).map((l) => l.rencana_item_id as string));

  // Kabar keluarga hanya untuk pengelola: kegiatan anggota lain hari ini, tanpa skor.
  let kabar: { nama: string; kalimat: string }[] = [];
  if (a.pengelola && rencana) {
    const { data: lain } = await db()
      .from("log_aktivitas")
      .select("anggota:anggota_id!inner (id, nama, anak_id), item:rencana_item_id (aktivitas:aktivitas_id (judul))")
      .eq("tanggal", hariIni)
      .eq("anggota.anak_id", a.anak_id)
      .neq("anggota_id", a.id);
    kabar = (lain ?? []).map((r) => {
      const ang = (Array.isArray(r.anggota) ? r.anggota[0] : r.anggota) as { nama: string };
      const it = (Array.isArray(r.item) ? r.item[0] : r.item) as { aktivitas: { judul: string } | { judul: string }[] };
      const akt = Array.isArray(it?.aktivitas) ? it.aktivitas[0] : it?.aktivitas;
      return { nama: ang.nama, kalimat: `${ang.nama} sudah mengerjakan "${akt?.judul ?? "aktivitas"}" hari ini.` };
    });
  }

  const baru =
    !!rencana?.disetujui_pada && Date.now() - Date.parse(rencana.disetujui_pada) < 3 * 86_400_000 && rencana.minggu_mulai >= senin;

  return Response.json({
    anggota: anggotaUntukLayar(a),
    anak,
    terapis: anak.terapis,
    rencana: rencana
      ? { id: rencana.id, pesan_keluarga: rencana.pesan_keluarga, baru, minggu_mulai: rencana.minggu_mulai }
      : null,
    aktivitas: item.map((i) => ({
      item_id: i.item_id,
      aktivitas_id: i.aktivitas_id,
      judul: i.judul,
      rutinitas: i.rutinitas,
      kata_target: kataUntuk([i.judul, ...i.langkah].join(" "), i.rutinitas, anak.kata_target),
      selesai_hari_ini: selesai.has(i.item_id),
    })),
    hari_aktif_minggu_ini: aktif.size,
    kabar_keluarga: kabar,
  });
});
