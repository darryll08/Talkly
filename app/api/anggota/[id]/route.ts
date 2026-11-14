import { denganAkses } from "@/lib/server/akses";
import { galat, kosong } from "@/lib/server/respons";
import { hapusSemuaSesi } from "@/lib/server/sesi";
import { db } from "@/lib/server/supabase";
import { hapusAudioAnggota } from "@/lib/keluarga/izin";

// O12: pengelola mencabut akses anggota lain, atau anggota menghapus dirinya sendiri.
// Menghapus anggota menghapus audio, rekaman, laporan, pesan, dan langganan push miliknya (cascade di database).

export const DELETE = denganAkses(["anggota"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Anggota tidak ditemukan.");
  const diriSendiri = params.id === saya.anggota.id;
  if (!diriSendiri && !saya.anggota.pengelola) return galat(403, "Hanya pengelola keluarga yang bisa mencabut akses anggota lain.");

  const { data: target } = await db()
    .from("anggota")
    .select("id, anak:anak_id (data_contoh)")
    .eq("id", params.id)
    .eq("anak_id", saya.anggota.anak_id)
    .maybeSingle();
  if (!target) return galat(404, "Anggota tidak ditemukan.");
  // Akun keluarga data contoh dipakai bersama di mode demo; sama seperti akun terapis contoh, tidak boleh dihapus.
  const anak = (Array.isArray(target.anak) ? target.anak[0] : target.anak) as { data_contoh: boolean } | null;
  if (anak?.data_contoh) return galat(409, "Akun data contoh tidak bisa dihapus.");

  await hapusAudioAnggota(target.id);
  const { error } = await db().from("anggota").delete().eq("id", target.id);
  if (error) throw error;
  if (diriSendiri) await hapusSemuaSesi();
  return kosong();
});
