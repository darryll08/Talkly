import { denganAkses } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";
import { tanggalWib } from "@/lib/server/waktu";
import { URUTAN_STATUS } from "@/lib/status/naikkan";
import { hariAktifPerAnak, usiaBulan } from "@/lib/terapis/program";

// D3 Minggu ini: sesi tiga hari ke depan per hari, terurut Bahas → Meninjau → Lanjut, lalu jam sesi.

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const GET = denganAkses(["terapis"], async (_req, { saya }) => {
  const { data: anak, error } = await db()
    .from("anak")
    .select("id, nama, tanggal_lahir, tahap, status, status_pemicu, hari_sesi, jam_sesi, data_contoh")
    .eq("terapis_id", saya.terapis.id);
  if (error) throw error;
  const daftar = anak ?? [];
  const aktif = await hariAktifPerAnak(daftar.map((a) => a.id));

  const hari = [0, 1, 2].map((maju) => {
    const tanggal = tanggalWib(-maju);
    const hariKe = new Date(`${tanggal}T00:00:00Z`).getUTCDay(); // 0 = Minggu
    const hariSesi = hariKe === 0 ? 7 : hariKe; // kolom hari_sesi: 1 = Senin … 7 = Minggu
    return {
      tanggal,
      nama_hari: NAMA_HARI[hariKe],
      anak: daftar
        .filter((a) => a.hari_sesi === hariSesi)
        .sort(
          (x, y) =>
            URUTAN_STATUS.indexOf(y.status) - URUTAN_STATUS.indexOf(x.status) || String(x.jam_sesi).localeCompare(String(y.jam_sesi)),
        )
        .map((a) => ({
          id: a.id,
          nama: a.nama,
          usia_bulan: usiaBulan(a.tanggal_lahir),
          tahap: a.tahap,
          status: a.status,
          pemicu: a.status_pemicu,
          jam_sesi: String(a.jam_sesi ?? "").slice(0, 5),
          hari_aktif_7: aktif.get(a.id) ?? 0,
          data_contoh: a.data_contoh,
        })),
    };
  });

  return Response.json({
    terapis: { id: saya.terapis.id, nama: saya.terapis.nama },
    ringkasan: {
      total: daftar.length,
      bahas: daftar.filter((a) => a.status === "bahas_minggu_ini").length,
      meninjau: daftar.filter((a) => a.status === "terapis_meninjau").length,
      lanjut: daftar.filter((a) => a.status === "lanjut").length,
    },
    hari,
  });
});
