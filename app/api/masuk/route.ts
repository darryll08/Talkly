import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, galat, kosong } from "@/lib/server/respons";
import { hapusSemuaSesi, pasangSesi } from "@/lib/server/sesi";
import { db } from "@/lib/server/supabase";
import { cocokKodeMasuk, idKodeMasuk } from "@/lib/keluarga/kode";

// O1c: masuk di ponsel baru dengan kode masuk pribadi. Lima kali salah → terkunci 15 menit (423).

const MAKS_GAGAL = 5;
const KUNCI_MS = 15 * 60_000;

export const POST = denganAkses(["publik"], async (req) => {
  const body = await bacaBody(req, API.masuk.request);
  if (body instanceof Response) return body;

  const { data: a } = await db()
    .from("anggota")
    .select("id, kode_masuk_hash, gagal_masuk, terkunci_sampai")
    .eq("kode_masuk_id", idKodeMasuk(body.kode_masuk))
    .eq("aktif", true)
    .maybeSingle();
  if (!a?.kode_masuk_hash) return galat(401, "Kode masuk belum cocok. Periksa lagi hurufnya.");

  if (a.terkunci_sampai && Date.parse(a.terkunci_sampai) > Date.now()) {
    const menit = Math.ceil((Date.parse(a.terkunci_sampai) - Date.now()) / 60_000);
    return galat(423, `Terlalu banyak percobaan. Coba lagi ${menit} menit lagi.`);
  }

  if (!(await cocokKodeMasuk(body.kode_masuk, a.kode_masuk_hash))) {
    const gagal = (a.gagal_masuk ?? 0) + 1;
    const kunci = gagal >= MAKS_GAGAL;
    await db()
      .from("anggota")
      .update({ gagal_masuk: kunci ? 0 : gagal, terkunci_sampai: kunci ? new Date(Date.now() + KUNCI_MS).toISOString() : null })
      .eq("id", a.id);
    return kunci ? galat(423, "Terlalu banyak percobaan. Coba lagi 15 menit lagi.") : galat(401, "Kode masuk belum cocok. Periksa lagi hurufnya.");
  }

  await db().from("anggota").update({ gagal_masuk: 0, terkunci_sampai: null, perangkat_terakhir: req.headers.get("user-agent")?.slice(0, 200) ?? null }).eq("id", a.id);
  await hapusSemuaSesi();
  await pasangSesi("anggota", a.id);
  return kosong();
});
