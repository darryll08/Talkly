import { API } from "@/lib/kontrak/api";
import { kataTerlarangDi } from "@/lib/kontrak/konten";
import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { seninWib, tanggalWib } from "@/lib/server/waktu";
import { ID_BANK } from "@/lib/terapis/program";

// D5 → O3: terapis menyetujui draf (boleh disunting). Rencana baru berlaku Senin depan,
// atau hari ini bila mulai_sekarang (dipakai demo supaya langsung tampil di ponsel keluarga).

export const POST = denganAkses(["terapis"], async (req, { saya, params }) => {
  const body = await bacaBody(req, API.rencanaSetujui.request.omit({ drafId: true }));
  if (body instanceof Response) return body;
  if (!/^[0-9a-f-]{36}$/i.test(params.drafId)) return galat(404, "Draf tidak ditemukan.");

  const { data: draf } = await db().from("draf_rencana").select("id, anak_id, status, sumber").eq("id", params.drafId).maybeSingle();
  if (!draf) return galat(404, "Draf tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, draf.anak_id);
  if (tolak) return tolak;
  if (draf.status !== "aktif") return galat(409, "Draf ini sudah disetujui atau diganti draf yang lebih baru.");
  if (body.isi.item.some((i) => !ID_BANK.has(i.aktivitas_id))) return galat(422, "Ada aktivitas di luar bank aktivitas.");
  if (kataTerlarangDi(body.isi.pesan_keluarga).length) return galat(422, "Pesan untuk keluarga memuat kata yang tidak dipakai di Talkly.");

  const { data: anggota } = await db().from("anggota").select("id").eq("anak_id", draf.anak_id);
  const sah = new Set((anggota ?? []).map((a) => a.id));
  if (body.isi.item.some((i) => i.anggota_id !== null && !sah.has(i.anggota_id))) return galat(422, "Ada anggota yang bukan bagian keluarga ini.");

  const senin = seninWib();
  const seninDepan = seninWib(new Date(Date.parse(`${senin}T12:00:00Z`) + 7 * 86_400_000));
  const minggu_mulai = body.mulai_sekarang ? tanggalWib() : seninDepan;
  const { data: rencana, error } = await db()
    .from("rencana")
    .insert({
      anak_id: draf.anak_id,
      minggu_mulai,
      sumber: draf.sumber === "ai" ? "draf_ai" : "terapis",
      pesan_keluarga: body.isi.pesan_keluarga,
      disetujui: true,
      disetujui_pada: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  await db().from("rencana_item").insert(body.isi.item.map((i, n) => ({ rencana_id: rencana.id, aktivitas_id: i.aktivitas_id, anggota_id: i.anggota_id, urutan: n + 1 })));
  await db().from("draf_rencana").update({ status: "disetujui", rencana_id: rencana.id, isi: body.isi }).eq("id", draf.id);
  if (body.isi.kata_target) await db().from("anak").update({ kata_target: body.isi.kata_target }).eq("id", draf.anak_id);

  return Response.json({ rencana_id: rencana.id, minggu_mulai });
});
