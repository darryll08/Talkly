import { denganAkses } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";
import { tanggalWib } from "@/lib/server/waktu";
import { hariAktif } from "@/lib/keluarga/aktivitas";
import { kirimKeAnggota } from "@/lib/keluarga/push";
import { HARI_TIDAK_AKTIF_MAKS } from "@/lib/status/aturan";
import { evaluasiStatus } from "@/lib/status/evaluasi";

// Cron harian (16.00 WIB). Proposal 2.5: tidak aktif hari ke-2 dan ke-3 → notifikasi lembut ke pengasuh;
// mulai hari ke-4 status anak dievaluasi (Terapis meninjau). Anggota yang belum mengerjakan aktivitas hari ini diingatkan.

export const maxDuration = 60;

export const GET = denganAkses(["cron"], async () => {
  const { data: anggota } = await db().from("anggota").select("id, anak_id").eq("aktif", true).limit(2000);
  let notifikasi = 0;
  const anakDievaluasi = new Set<string>();
  const sejak = tanggalWib(7);

  for (const a of anggota ?? []) {
    const aktif = [...(await hariAktif(a.id, sejak))].sort();
    const terakhir = aktif.at(-1);
    const libur = terakhir ? Math.round((Date.parse(tanggalWib()) - Date.parse(terakhir)) / 86_400_000) : 8;
    if (libur === 0) continue;
    if (libur === 2 || libur === 3) {
      notifikasi += await kirimKeAnggota([a.id], {
        judul: "Minggu ini berat?",
        isi: "Tidak apa-apa. Ceritakan sendiri juga dihitung, cukup satu menit.",
        url: "/ceritakan",
      });
    } else if (libur === 1) {
      notifikasi += await kirimKeAnggota([a.id], { judul: "Aktivitas hari ini", isi: "Lima menit saja, di rutinitas yang biasa.", url: "/hari-ini" });
    }
    if (libur >= HARI_TIDAK_AKTIF_MAKS) anakDievaluasi.add(a.anak_id);
  }

  let status_naik = 0;
  for (const anakId of anakDievaluasi) if (await evaluasiStatus(anakId)) status_naik++;
  return Response.json({ notifikasi, status_naik });
});
