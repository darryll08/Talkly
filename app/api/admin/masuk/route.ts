import { API } from "@/lib/kontrak/api";
import { cocokkanAdmin } from "@/lib/admin/akun";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, galat, kosong } from "@/lib/server/respons";
import { hapusSemuaSesi, pasangSesi } from "@/lib/server/sesi";

export const POST = denganAkses(["publik"], async (req) => {
  const body = await bacaBody(req, API.adminMasuk.request);
  if (body instanceof Response) return body;
  const id = await cocokkanAdmin(body.email, body.kata_sandi);
  if (!id) return galat(401, "Email atau kata sandi belum cocok.");
  await hapusSemuaSesi();
  await pasangSesi("admin", id);
  return kosong();
});
