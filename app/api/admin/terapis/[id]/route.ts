import { denganAkses } from "@/lib/server/akses";
import { galat, kosong } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";

// A1: hapus akun terapis. Anak yang ditanganinya tetap ada (terapis_id menjadi null) dan bisa dialihkan nanti.
// Akun di klinik data contoh dijaga agar mode demo tidak rusak.

export const DELETE = denganAkses(["admin"], async (_req, { params }) => {
  const { data } = await db().from("terapis").select("id, klinik:klinik_id (data_contoh)").eq("id", params.id).maybeSingle();
  if (!data) return galat(404, "Terapis tidak ditemukan.");
  const klinik = (Array.isArray(data.klinik) ? data.klinik[0] : data.klinik) as { data_contoh: boolean } | null;
  if (klinik?.data_contoh) return galat(409, "Akun data contoh tidak bisa dihapus.");
  const { error } = await db().auth.admin.deleteUser(data.id);
  if (error) throw error;
  return kosong();
});
