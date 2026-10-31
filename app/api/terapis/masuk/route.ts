import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, galat, kosong } from "@/lib/server/respons";
import { hapusSemuaSesi, pasangSesi } from "@/lib/server/sesi";
import { cocokkanTerapis } from "@/lib/terapis/masuk";

export const POST = denganAkses(["publik"], async (req) => {
  const body = await bacaBody(req, API.terapisMasuk.request);
  if (body instanceof Response) return body;
  const id = await cocokkanTerapis(body.email, body.kata_sandi);
  if (!id) return galat(401, "Email atau kata sandi belum cocok.");
  await hapusSemuaSesi();
  await pasangSesi("terapis", id);
  return kosong();
});
