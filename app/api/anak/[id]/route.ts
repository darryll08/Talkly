import { API } from "@/lib/kontrak/api";
import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { naikkanStatus } from "@/lib/status/naikkan";
import { aktivitasRencanaTerbaru, ID_BANK } from "@/lib/terapis/program";

// D1 ubah: baca dan ubah program anak. Mengganti aktivitas mengganti item rencana yang sedang berlaku.

const KOLOM = "id, nama, tanggal_lahir, pendengaran, tahap, strategi_fokus, kata_target, ukuran_nonaktif, minat, rutinitas, hari_sesi, jam_sesi, status, data_contoh";

async function bacaAnak(id: string) {
  const [{ data }, rencana] = await Promise.all([db().from("anak").select(KOLOM).eq("id", id).single(), aktivitasRencanaTerbaru(id)]);
  if (!data) return null;
  return { ...data, jam_sesi: String(data.jam_sesi ?? "00:00").slice(0, 5), hari_sesi: data.hari_sesi ?? 1, aktivitas_id: rencana.item.map((i) => i.aktivitas_id) };
}

export const GET = denganAkses(["terapis"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Data anak tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, params.id);
  if (tolak) return tolak;
  return Response.json(await bacaAnak(params.id));
});

export const PATCH = denganAkses(["terapis"], async (req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Data anak tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, params.id);
  if (tolak) return tolak;
  const body = await bacaBody(req, API.anakUbah.request.omit({ id: true }));
  if (body instanceof Response) return body;

  const { aktivitas_id, ...ubah } = body;
  if (aktivitas_id?.some((id) => !ID_BANK.has(id))) return galat(422, "Ada aktivitas di luar bank aktivitas.");
  if (Object.keys(ubah).length) {
    const { error } = await db().from("anak").update(ubah).eq("id", params.id);
    if (error) throw error;
  }
  if (aktivitas_id) {
    const { rencana_id } = await aktivitasRencanaTerbaru(params.id);
    if (rencana_id) {
      await db().from("rencana_item").delete().eq("rencana_id", rencana_id);
      await db().from("rencana_item").insert(aktivitas_id.map((id, i) => ({ rencana_id, aktivitas_id: id, anggota_id: null, urutan: i + 1 })));
    }
  }
  if (ubah.pendengaran && ubah.pendengaran !== "normal") {
    await naikkanStatus(params.id, "terapis_meninjau", ubah.pendengaran === "gangguan" ? "Ada temuan pendengaran" : "Pendengaran belum diperiksa");
  }
  return Response.json({ id: params.id });
});
