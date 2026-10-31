import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";

// A1: admin membuat akun terapis (Supabase Auth + baris terapis), sekaligus klinik baru bila perlu.

export const POST = denganAkses(["admin"], async (req) => {
  const body = await bacaBody(req, API.adminTerapisBuat.request);
  if (body instanceof Response) return body;
  if (!body.klinik_id && !body.klinik_baru) return galat(422, "Pilih klinik atau tulis nama klinik baru.");

  let klinikId = body.klinik_id;
  if (klinikId) {
    const { data } = await db().from("klinik").select("id").eq("id", klinikId).maybeSingle();
    if (!data) return galat(422, "Klinik tidak ditemukan.");
  }

  const akun = await db().auth.admin.createUser({
    email: body.email.toLowerCase(),
    password: body.kata_sandi,
    email_confirm: true,
    user_metadata: { nama: body.nama },
  });
  if (akun.error || !akun.data.user) {
    if (akun.error && /already|registered|exists/i.test(akun.error.message)) return galat(409, "Email ini sudah dipakai akun lain.");
    throw akun.error ?? new Error("akun terapis tidak terbuat");
  }
  const id = akun.data.user.id;

  try {
    if (!klinikId) {
      const { data, error } = await db().from("klinik").insert({ nama: body.klinik_baru! }).select("id").single();
      if (error) throw error;
      klinikId = data.id as string;
    }
    const { error } = await db().from("terapis").insert({ id, klinik_id: klinikId, nama: body.nama });
    if (error) throw error;
  } catch (e) {
    // Jangan tinggalkan akun Auth tanpa baris terapis.
    await db().auth.admin.deleteUser(id);
    throw e;
  }
  return Response.json({ id });
});
