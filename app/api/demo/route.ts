import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { ID_CONTOH } from "@/lib/server/data-contoh";
import { bacaBody, galat, kosong } from "@/lib/server/respons";
import { hapusSemuaSesi, pasangSesi } from "@/lib/server/sesi";
import { db } from "@/lib/server/supabase";

// Mode demo juri: masuk sebagai persona data contoh tanpa kode atau kata sandi. Hanya bila DEMO=1.
// Semua cookie lama dihapus dulu supaya tidak ada sesi peran lain yang tertinggal (K9).

export const POST = denganAkses(["publik"], async (req) => {
  if (process.env.DEMO !== "1") return galat(404, "Mode demo tidak aktif.");
  const body = await bacaBody(req, API.demo.request);
  if (body instanceof Response) return body;

  await hapusSemuaSesi();

  if (body.sebagai === "kak_nadia") {
    const { data } = await db()
      .from("terapis")
      .select("id")
      .eq("klinik_id", ID_CONTOH.klinik)
      .eq("nama", "Kak Nadia")
      .maybeSingle();
    if (!data) return galat(404, "Data contoh belum dipasang. Jalankan npm run seed.");
    await pasangSesi("terapis", data.id);
    return kosong();
  }

  const anggotaId = { ibu_sari: ID_CONTOH.ibuSari, mbak_sri: ID_CONTOH.mbakSri, uji_b: ID_CONTOH.ibuNara }[body.sebagai];
  const { data } = await db().from("anggota").select("id").eq("id", anggotaId).eq("aktif", true).maybeSingle();
  if (!data) return galat(404, "Data contoh belum dipasang. Jalankan npm run seed.");
  await pasangSesi("anggota", data.id);
  return kosong();
});
