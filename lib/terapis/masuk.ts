import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/server/supabase";

// Login terapis lewat Supabase Auth (email + kata sandi). Galat sama untuk email tidak ada dan kata sandi salah.

export async function cocokkanTerapis(email: string, kataSandi: string): Promise<string | null> {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password: kataSandi });
  if (error || !data.user) return null;
  // Akun Auth tanpa baris terapis (misalnya akun lain di proyek yang sama) tidak boleh masuk dasbor.
  const { data: terapis } = await db().from("terapis").select("id").eq("id", data.user.id).maybeSingle();
  return terapis?.id ?? null;
}
