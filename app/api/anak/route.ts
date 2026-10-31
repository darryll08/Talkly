import { API } from "@/lib/kontrak/api";
import { denganAkses } from "@/lib/server/akses";
import { bacaBody, galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { seninWib } from "@/lib/server/waktu";
import { naikkanStatus } from "@/lib/status/naikkan";
import { ID_BANK } from "@/lib/terapis/program";

// D1 baru: terapis membuat program anak. Aktivitas pilihan terapis langsung menjadi rencana minggu pertama.
// Tidak membuat draf AI (draf pertama dibuat dari Setelah sesi).

export const POST = denganAkses(["terapis"], async (req, { saya }) => {
  const body = await bacaBody(req, API.anakBuat.request);
  if (body instanceof Response) return body;
  if (body.aktivitas_id.some((id) => !ID_BANK.has(id))) return galat(422, "Ada aktivitas di luar bank aktivitas.");

  const { aktivitas_id, ...data } = body;
  const { data: anak, error } = await db()
    .from("anak")
    .insert({ ...data, klinik_id: saya.terapis.klinik_id, terapis_id: saya.terapis.id, status: "lanjut" })
    .select("id")
    .single();
  if (error) throw error;

  const { data: rencana, error: e2 } = await db()
    .from("rencana")
    .insert({
      anak_id: anak.id,
      minggu_mulai: seninWib(),
      sumber: "terapis",
      pesan_keluarga: "Selamat datang. Mulai dari satu aktivitas per hari, ya.",
      disetujui: true,
      disetujui_pada: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (e2) throw e2;
  await db().from("rencana_item").insert(aktivitas_id.map((id, i) => ({ rencana_id: rencana.id, aktivitas_id: id, anggota_id: null, urutan: i + 1 })));

  await db().from("riwayat_status").insert({ anak_id: anak.id, status: "lanjut", pemicu: "Program baru" });
  if (body.pendengaran !== "normal") {
    await naikkanStatus(anak.id, "terapis_meninjau", body.pendengaran === "gangguan" ? "Ada temuan pendengaran" : "Pendengaran belum diperiksa");
  }
  return Response.json({ id: anak.id });
});
