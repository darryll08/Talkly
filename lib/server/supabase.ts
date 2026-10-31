import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klien service role. Hanya diimpor dari app/api dan lib/server: keluarga tidak punya akses langsung ke database,
// semua kueri keluarga lewat dbKeluarga() di akses.ts.

let klien: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (typeof window !== "undefined") throw new Error("lib/server/supabase hanya untuk server");
  if (klien) return klien;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) throw new Error("NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi");
  klien = createClient(url, kunci, { auth: { persistSession: false, autoRefreshToken: false } });
  return klien;
}
