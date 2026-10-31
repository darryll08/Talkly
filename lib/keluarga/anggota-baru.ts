import { db } from "@/lib/server/supabase";
import { buatKodeMasuk } from "./kode";

// Memberi anggota kode masuk pribadi baru. kode_masuk_id unik; bila bertabrakan, coba lagi.
export async function pasangKodeMasuk(anggotaId: string): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const k = await buatKodeMasuk();
    const { error } = await db()
      .from("anggota")
      .update({ kode_masuk_id: k.id, kode_masuk_hash: k.hash, gagal_masuk: 0, terkunci_sampai: null })
      .eq("id", anggotaId);
    if (!error) return k.kode;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Gagal membuat kode masuk unik");
}

export async function jumlahAnggotaAktif(anakId: string) {
  const { count } = await db().from("anggota").select("id", { count: "exact", head: true }).eq("anak_id", anakId).eq("aktif", true);
  return count ?? 0;
}
