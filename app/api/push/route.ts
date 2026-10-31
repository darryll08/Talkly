import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, kosong } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";

// O00, O2b, O12: simpan langganan Web Push ponsel ini untuk anggota yang sedang masuk.

export const POST = denganAkses(["anggota"], async (req, { saya }) => {
  const body = await bacaBody(req, API.pushDaftar.request);
  if (body instanceof Response) return body;
  const { error } = await db()
    .from("langganan_push")
    .upsert({ endpoint: body.endpoint, anggota_id: saya.anggota.id, langganan: body }, { onConflict: "endpoint" });
  if (error) throw error;
  return kosong();
});
