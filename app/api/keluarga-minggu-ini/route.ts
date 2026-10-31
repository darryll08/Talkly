import { denganAkses } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";
import { hariAktif, seninWib } from "@/lib/keluarga/aktivitas";

// O11 Keluarga minggu ini (hanya pengelola): kegiatan setiap anggota tanpa skor atau peringkat,
// supaya fitur ini tidak menjadi alat pengawasan antaranggota keluarga (proposal 4.3).

export const GET = denganAkses(["pengelola"], async (_req, { saya }) => {
  const senin = seninWib();
  const { data: anggota, error } = await db()
    .from("anggota")
    .select("id, nama, peran, izin_nilai")
    .eq("anak_id", saya.anggota.anak_id)
    .eq("aktif", true)
    .order("dibuat");
  if (error) throw error;

  const hasil = await Promise.all(
    (anggota ?? []).map(async (a) => {
      const [aktif, { data: log }] = await Promise.all([
        hariAktif(a.id, senin),
        db().from("log_aktivitas").select("item:rencana_item_id (aktivitas:aktivitas_id (judul))").eq("anggota_id", a.id).gte("tanggal", senin),
      ]);
      const hitung = new Map<string, number>();
      for (const l of log ?? []) {
        const it = (Array.isArray(l.item) ? l.item[0] : l.item) as { aktivitas: { judul: string } | { judul: string }[] } | null;
        const judul = (Array.isArray(it?.aktivitas) ? it.aktivitas[0] : it?.aktivitas)?.judul;
        if (judul) hitung.set(judul, (hitung.get(judul) ?? 0) + 1);
      }
      const jumlah = [...hitung.values()].reduce((x, y) => x + y, 0);
      const kalimat =
        aktif.size === 0
          ? `${a.nama} belum mencatat kegiatan minggu ini.`
          : `${a.nama} aktif ${aktif.size} hari minggu ini${jumlah ? ` dan mengerjakan ${jumlah} aktivitas` : ""}.`;
      return {
        id: a.id,
        nama: a.nama,
        peran: a.peran,
        saya: a.id === saya.anggota.id,
        izin_nilai: a.izin_nilai,
        hari_aktif: aktif.size,
        aktivitas: [...hitung].map(([judul, kali]) => ({ judul, kali })),
        kalimat,
      };
    }),
  );
  return Response.json({ minggu_mulai: senin, anggota: hasil });
});
