import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { hapusSemuaSesi, pasangSesi } from "@/lib/server/sesi";
import { db } from "@/lib/server/supabase";
import { jumlahAnggotaAktif, pasangKodeMasuk } from "@/lib/keluarga/anggota-baru";
import { hashUndangan, MAKS_ANGGOTA } from "@/lib/keluarga/kode";

// O1 → O2c: bergabung dengan kode undangan. Anggota pertama keluarga menjadi pengelola.
// Kode masuk pribadi dikembalikan sekali dan tidak bisa dilihat lagi (hanya diganti).

export const POST = denganAkses(["publik"], async (req) => {
  const body = await bacaBody(req, API.gabung.request);
  if (body instanceof Response) return body;

  const { data: u } = await db()
    .from("undangan")
    .select("id, anak_id, peran, pengelola_keluarga, kedaluwarsa, dipakai_oleh")
    .eq("kode_hash", hashUndangan(body.kode))
    .maybeSingle();
  if (!u) return galat(404, "Kode undangan tidak ditemukan. Periksa lagi hurufnya.");
  if (u.dipakai_oleh) return galat(409, "Kode ini sudah dipakai. Minta kode baru ke terapis atau pengelola keluarga.");
  if (Date.parse(u.kedaluwarsa) < Date.now()) return galat(410, "Kode ini sudah lewat 7 hari. Minta kode baru.");

  const jumlah = await jumlahAnggotaAktif(u.anak_id);
  if (jumlah >= MAKS_ANGGOTA) return galat(409, `Keluarga ini sudah ${MAKS_ANGGOTA} anggota.`);

  const { data: anggota, error } = await db()
    .from("anggota")
    .insert({ anak_id: u.anak_id, nama: body.nama, peran: u.peran, pengelola_keluarga: u.pengelola_keluarga || jumlah === 0 })
    .select("id")
    .single();
  if (error) throw error;

  // Tandai undangan terpakai hanya bila belum dipakai orang lain di saat bersamaan.
  const { data: dipakai } = await db()
    .from("undangan")
    .update({ dipakai_oleh: anggota.id, dipakai_pada: new Date().toISOString() })
    .eq("id", u.id)
    .is("dipakai_oleh", null)
    .select("id");
  if (!dipakai?.length) {
    await db().from("anggota").delete().eq("id", anggota.id);
    return galat(409, "Kode ini baru saja dipakai. Minta kode baru.");
  }

  const kode_masuk = await pasangKodeMasuk(anggota.id);
  await hapusSemuaSesi();
  await pasangSesi("anggota", anggota.id);
  return Response.json({ kode_masuk, anggota_id: anggota.id });
});
