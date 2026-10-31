import { denganAkses } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";

// Cron harian (02.00 WIB): hapus audio yang sudah lewat 7 hari (izin dengar menyala) dari bucket.

export const GET = denganAkses(["cron"], async () => {
  const { data } = await db()
    .from("rekaman")
    .select("id, path_audio")
    .not("path_audio", "is", null)
    .lt("audio_kedaluwarsa", new Date().toISOString())
    .limit(500);
  const baris = data ?? [];
  if (baris.length) {
    await db().storage.from("audio").remove(baris.map((r) => r.path_audio as string));
    await db().from("rekaman").update({ path_audio: null, audio_kedaluwarsa: null }).in("id", baris.map((r) => r.id));
  }
  return Response.json({ dihapus: baris.length });
});
