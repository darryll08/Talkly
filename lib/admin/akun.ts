import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/server/supabase";

// Akun admin Talkly memakai Supabase Auth dengan app_metadata.peran = "admin", jadi tidak perlu tabel baru.
// Admin membuat klinik dan akun terapis; terapis tidak mendaftar sendiri.

export const EMAIL_ADMIN_CONTOH = "admin@contoh.talkly.id";

export async function cocokkanAdmin(email: string, kataSandi: string): Promise<string | null> {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: kataSandi });
  if (error || !data.user) return null;
  return data.user.app_metadata?.peran === "admin" ? data.user.id : null;
}

/** Semua akun Auth (proyek ini kecil: cukup satu halaman 1000). */
export async function semuaAkun() {
  const { data, error } = await db().auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users;
}

/**
 * Akun admin data contoh untuk mode demo. Dibuat saat pertama kali dipakai.
 * Kata sandi diisi seed (DEMO_TERAPIS_KATA_SANDI); bila dibuat dari demo, sandinya acak dan hanya bisa masuk lewat demo.
 */
export async function pastikanAdminContoh(kataSandi?: string): Promise<string> {
  const ada = (await semuaAkun()).find((u) => u.email === EMAIL_ADMIN_CONTOH);
  if (ada) {
    const ubah: Parameters<ReturnType<typeof db>["auth"]["admin"]["updateUserById"]>[1] = {};
    if (ada.app_metadata?.peran !== "admin") ubah.app_metadata = { ...ada.app_metadata, peran: "admin" };
    if (kataSandi) ubah.password = kataSandi;
    if (Object.keys(ubah).length > 0) {
      const { error } = await db().auth.admin.updateUserById(ada.id, ubah);
      if (error) throw error;
    }
    return ada.id;
  }
  const { data, error } = await db().auth.admin.createUser({
    email: EMAIL_ADMIN_CONTOH,
    password: kataSandi ?? `${crypto.randomUUID()}A1`,
    email_confirm: true,
    app_metadata: { peran: "admin" },
    user_metadata: { nama: "Admin Talkly" },
  });
  if (error || !data.user) throw error ?? new Error("akun admin contoh tidak terbuat");
  return data.user.id;
}
