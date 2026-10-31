import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { DASAR_HUKUM, hapusAudioAnggota, PENJELASAN_IZIN } from "@/lib/keluarga/izin";

// O2 dan O12: tiga izin rekaman milik anggota ini. Mematikan izin dengar langsung menghapus audio yang tersimpan.

export const GET = denganAkses(["anggota"], async (_req, { saya }) => {
  const { izin_nilai, izin_dengar, izin_klip } = saya.anggota;
  return Response.json({ izin: { izin_nilai, izin_dengar, izin_klip }, penjelasan: PENJELASAN_IZIN, dasar_hukum: DASAR_HUKUM });
});

export const PATCH = denganAkses(["anggota"], async (req, { saya }) => {
  const body = await bacaBody(req, API.izinUbah.request);
  if (body instanceof Response) return body;
  const { data, error } = await db().from("anggota").update(body).eq("id", saya.anggota.id).select("izin_nilai, izin_dengar, izin_klip").single();
  if (error) throw error;
  const audio_dihapus = body.izin_dengar === false ? await hapusAudioAnggota(saya.anggota.id) : 0;
  return Response.json({ izin: data, audio_dihapus });
});
