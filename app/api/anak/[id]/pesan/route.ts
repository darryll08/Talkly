import { API } from "@/lib/kontrak/api";
import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { daftarPesan, kirimPesan } from "@/lib/keluarga/pesan";
import { anggotaKeluarga, kirimDiam, kirimKeAnggota } from "@/lib/keluarga/push";

// D6 Pesan keluarga (dasbor): membaca menandai pesan keluarga sudah dibaca.

export const GET = denganAkses(["terapis"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Data anak tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, params.id);
  if (tolak) return tolak;
  const pesan = await daftarPesan(params.id);
  await db().from("pesan").update({ dibaca: true }).eq("anak_id", params.id).not("pengirim_anggota", "is", null).eq("dibaca", false);
  return Response.json({ pesan });
});

export const POST = denganAkses(["terapis"], async (req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Data anak tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, params.id);
  if (tolak) return tolak;
  const body = await bacaBody(req, API.anakPesanKirim.request.omit({ id: true }));
  if (body instanceof Response) return body;
  const pesan = await kirimPesan(params.id, { terapis: saya.terapis.id }, body.isi);
  kirimDiam(anggotaKeluarga(params.id).then((ids) => kirimKeAnggota(ids, { judul: `Balasan dari ${saya.terapis.nama}`, isi: body.isi.slice(0, 120), url: "/pesan" })));
  return Response.json(pesan);
});
