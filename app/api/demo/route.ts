import { API } from "@/lib/kontrak/api";
import { pastikanAdminContoh } from "@/lib/admin/akun";
import { denganAkses } from "@/lib/server/akses";
import { ID_CONTOH } from "@/lib/server/data-contoh";
import { bacaBody, galat, kosong } from "@/lib/server/respons";
import { hapusSemuaSesi, pasangSesi } from "@/lib/server/sesi";
import { db } from "@/lib/server/supabase";
import { seninWib } from "@/lib/server/waktu";
import { BANK } from "@/lib/terapis/program";

// Mode demo juri: masuk sebagai persona data contoh tanpa kode atau kata sandi. Hanya bila DEMO=1.
// Semua cookie lama dihapus dulu supaya tidak ada sesi peran lain yang tertinggal (K9).

export const POST = denganAkses(["publik"], async (req) => {
  if (process.env.DEMO !== "1") return galat(404, "Mode demo tidak aktif.");
  const body = await bacaBody(req, API.demo.request);
  if (body instanceof Response) return body;

  await hapusSemuaSesi();

  if (body.sebagai === "admin") {
    await pasangSesi("admin", await pastikanAdminContoh());
    return kosong();
  }

  if (body.sebagai === "kak_nadia") {
    const { data } = await db()
      .from("terapis")
      .select("id")
      .eq("klinik_id", ID_CONTOH.klinik)
      .eq("nama", "Kak Nadia")
      .maybeSingle();
    if (!data) return galat(404, "Data contoh belum dipasang. Jalankan npm run seed.");
    await pasangSesi("terapis", data.id);
    return kosong();
  }

  if (body.sebagai === "ibu_alya" || body.sebagai === "ibu_bima" || body.sebagai === "ibu_citra") {
    // Keluarga lain di klinik contoh (seed anakLain), supaya terlihat tiap akun punya datanya sendiri.
    const nama = { ibu_alya: "Ibu Alya", ibu_bima: "Ibu Bima", ibu_citra: "Ibu Citra" }[body.sebagai];
    const { data } = await db()
      .from("anggota")
      .select("id, anak_id, anak!inner (klinik_id)")
      .eq("nama", nama)
      .eq("anak.klinik_id", ID_CONTOH.klinik)
      .eq("aktif", true)
      .maybeSingle();
    if (!data) return galat(404, "Data contoh belum dipasang. Jalankan npm run seed.");
    await pastikanRencana(data.anak_id as string);
    await pasangSesi("anggota", data.id as string);
    return kosong();
  }

  const anggotaId = { ibu_sari: ID_CONTOH.ibuSari, mbak_sri: ID_CONTOH.mbakSri, uji_b: ID_CONTOH.ibuNara }[body.sebagai];
  const { data } = await db().from("anggota").select("id").eq("id", anggotaId).eq("aktif", true).maybeSingle();
  if (!data) return galat(404, "Data contoh belum dipasang. Jalankan npm run seed.");
  await pasangSesi("anggota", data.id);
  return kosong();
});

/** Anak contoh selain Raka di-seed tanpa rencana. Beri rencana awal tiga aktivitas agar Hari ini tidak kosong. */
async function pastikanRencana(anakId: string) {
  const { count } = await db().from("rencana").select("id", { count: "exact", head: true }).eq("anak_id", anakId).eq("disetujui", true);
  if (count) return;
  const { data: rencana, error } = await db()
    .from("rencana")
    .insert({
      anak_id: anakId,
      minggu_mulai: seninWib(),
      sumber: "terapis",
      pesan_keluarga: "Minggu ini kita mulai pelan-pelan lagi, ya. Satu aktivitas sehari sudah cukup.",
      disetujui: true,
      disetujui_pada: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  await db()
    .from("rencana_item")
    .insert(BANK.slice(0, 3).map((a, i) => ({ rencana_id: rencana.id, aktivitas_id: a.id, anggota_id: null, urutan: i + 1 })));
}
