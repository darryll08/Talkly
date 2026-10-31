import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody } from "@/lib/server/respons";
import { daftarPesan, kirimPesan } from "@/lib/keluarga/pesan";

// Pesan (ponsel keluarga): percakapan dengan terapis anak.

export const GET = denganAkses(["anggota"], async (_req, { saya }) => {
  return Response.json({ pesan: await daftarPesan(saya.anggota.anak_id) });
});

export const POST = denganAkses(["anggota"], async (req, { saya }) => {
  const body = await bacaBody(req, API.pesanKirim.request);
  if (body instanceof Response) return body;
  return Response.json(await kirimPesan(saya.anggota.anak_id, { anggota: saya.anggota.id }, body.isi, body.konteks));
});
