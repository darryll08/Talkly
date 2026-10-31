import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";

// D4: tautan putar audio untuk terapis yang menangani anak, hanya bila izin dengar perekam menyala.
// Tautan bertanda tangan berlaku 5 menit, tanpa unduhan; setiap permintaan dicatat di log_dengar.

const BERLAKU_S = 300;

export const GET = denganAkses(["terapis"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Rekaman tidak ditemukan.");
  const { data: r } = await db()
    .from("rekaman")
    .select("id, anak_id, path_audio, perekam:anggota_id (izin_dengar)")
    .eq("id", params.id)
    .maybeSingle();
  if (!r) return galat(404, "Rekaman tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, r.anak_id);
  if (tolak) return tolak;
  const izin = (Array.isArray(r.perekam) ? r.perekam[0] : r.perekam) as { izin_dengar: boolean } | null;
  if (!izin?.izin_dengar) return galat(403, "Perekam tidak mengizinkan terapis mendengar rekaman ini.");
  if (!r.path_audio) return galat(404, "Audio rekaman ini sudah dihapus.");

  const { data, error } = await db().storage.from("audio").createSignedUrl(r.path_audio, BERLAKU_S);
  if (error || !data) throw error ?? new Error("tautan audio gagal dibuat");
  await db().from("log_dengar").insert({ rekaman_id: r.id, terapis_id: saya.terapis.id });
  return Response.json({ url: data.signedUrl, berlaku_s: BERLAKU_S });
});
