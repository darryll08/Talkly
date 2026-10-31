import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { hariAktif } from "@/lib/keluarga/aktivitas";
import { tanggalWib } from "@/lib/server/waktu";
import { kataDilaporkan, muatLaporan, muatRekaman, rentangRata, saranSesi, strategi, tren } from "@/lib/status/agregat";

// D4 Kartu anak: dibaca terapis sebelum sesi dalam ≤ 3 menit. Hanya terapis yang menangani anak itu.

function usiaBulan(tanggalLahir: string) {
  const l = new Date(tanggalLahir);
  const n = new Date();
  return (n.getFullYear() - l.getFullYear()) * 12 + n.getMonth() - l.getMonth() - (n.getDate() < l.getDate() ? 1 : 0);
}

export const GET = denganAkses(["terapis"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Data anak tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, params.id);
  if (tolak) return tolak;

  const [{ data: anak }, { data: anggota }, rekaman, laporan] = await Promise.all([
    db().from("anak").select("id, nama, tahap, kata_target, tanggal_lahir, status, status_pemicu, pendengaran, data_contoh").eq("id", params.id).single(),
    db().from("anggota").select("id, nama, peran, izin_nilai, izin_dengar").eq("anak_id", params.id).eq("aktif", true).order("dibuat"),
    muatRekaman(params.id, 35),
    muatLaporan(params.id, 14),
  ]);
  if (!anak || !anggota) return galat(404, "Data anak tidak ditemukan.");

  const izinDengar = new Map(anggota.map((a) => [a.id, a.izin_dengar as boolean]));
  const namaAnggota = new Map(anggota.map((a) => [a.id, a.nama as string]));
  const bisaDidengar = (r: (typeof rekaman)[number]) => !!r.path_audio && !!izinDengar.get(r.anggota_id);
  const st = strategi(rekaman);
  const tr = tren(rekaman);
  const empatBelas = rekaman.filter((r) => Date.parse(r.dibuat) >= Date.now() - 14 * 86_400_000);
  const terpilih = rekaman.find((r) => r.status === "dinilai" && r.hasil?.ukuran);
  const sejak7 = tanggalWib(6);

  const perPengasuh = await Promise.all(
    anggota.map(async (a) => {
      const milik = empatBelas.filter((r) => r.anggota_id === a.id && r.status === "dinilai" && r.hasil?.ukuran);
      return {
        anggota_id: a.id,
        nama: a.nama,
        peran: a.peran,
        rekaman: milik.length,
        jeda_rata_s: rentangRata(milik.map((r) => r.hasil!.ukuran!.jeda_rata_s).filter((x): x is number => x !== null)).nilai,
        giliran_per_menit: rentangRata(milik.map((r) => (r.hasil!.ukuran!.giliran * 60) / r.durasi_s)).nilai,
        hari_aktif_7: (await hariAktif(a.id, sejak7)).size,
      };
    }),
  );

  const { data: terapis } = await db().from("terapis").select("id, nama").eq("id", saya.terapis.id).single();

  return Response.json({
    anak: {
      id: anak.id,
      nama: anak.nama,
      tahap: anak.tahap,
      kata_target: anak.kata_target,
      terapis: terapis ?? { id: saya.terapis.id, nama: saya.terapis.nama },
      usia_bulan: usiaBulan(anak.tanggal_lahir),
      status: anak.status,
      pemicu: anak.status_pemicu,
      pendengaran: anak.pendengaran,
      data_contoh: anak.data_contoh,
    },
    strategi: st,
    tren: tr,
    per_pengasuh: perPengasuh,
    rekaman_terpilih: terpilih
      ? {
          id: terpilih.id,
          dibuat: terpilih.dibuat,
          perekam: namaAnggota.get(terpilih.anggota_id) ?? "Keluarga",
          durasi_s: terpilih.durasi_s,
          ajakan: terpilih.hasil!.ajakan,
          suara_anak: terpilih.hasil!.suara_anak,
          ukuran: terpilih.hasil!.ukuran,
          laporan_terapis: terpilih.hasil!.laporan_terapis,
          bisa_didengar: bisaDidengar(terpilih),
        }
      : null,
    rekaman_terbaru: empatBelas.slice(0, 6).map((r) => ({
      id: r.id,
      dibuat: r.dibuat,
      perekam: namaAnggota.get(r.anggota_id) ?? "Keluarga",
      status: r.status,
      jeda_rata_s: r.hasil?.ukuran?.jeda_rata_s ?? null,
      bisa_didengar: bisaDidengar(r),
      kurang_tepat: !!r.kurang_tepat,
    })),
    laporan_keluarga: laporan.map((l) => ({ id: l.id, tanggal: l.tanggal, nama: l.nama, laporan: l.laporan })),
    kata_dilaporkan: kataDilaporkan(laporan),
    kutipan_regresi: laporan
      .filter((l) => l.regresi && l.laporan.jenis === "catatan_malam" && l.laporan.isi.catatan)
      .map((l) => ({ tanggal: l.tanggal, nama: l.nama, kutipan: l.laporan.jenis === "catatan_malam" ? l.laporan.isi.catatan : "" })),
    saran_sesi: saranSesi({ namaAnak: anak.nama, strategi: st, tren: tr, rekaman: empatBelas, laporan, anggota }),
  });
});
