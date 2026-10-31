import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { anakRingkas } from "@/lib/keluarga/anggota";
import { kartuBenda } from "@/lib/ai/ekstrak";

// O4b Kartu foto benda: hanya NAMA benda yang dikirim ke server dan AI; foto tetap di ponsel keluarga.

export const POST = denganAkses(["anggota"], async (req, { saya }) => {
  const body = await bacaBody(req, API.kartuBenda.request);
  if (body instanceof Response) return galat(422, "Ketik nama bendanya dulu.");
  const anak = await anakRingkas(saya.anggota.anak_id);
  return Response.json(await kartuBenda(body.nama_benda, anak));
});
