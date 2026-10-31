import { denganAkses, dbKeluarga } from "@/lib/server/akses";
import { galat, kosong } from "@/lib/server/respons";
import { naikkanStatus } from "@/lib/status/naikkan";

// O6 "Hasil ini kurang tepat?": tandai rekaman dan naikkan status anak ke Terapis meninjau (Tabel 2).

export const POST = denganAkses(["anggota"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Rekaman tidak ditemukan.");
  const { data } = await dbKeluarga(saya.anggota).ubah("rekaman", { kurang_tepat: true }).eq("id", params.id).select("id");
  if (!data?.length) return galat(404, "Rekaman tidak ditemukan.");
  await naikkanStatus(saya.anggota.anak_id, "terapis_meninjau", "Hasil ditandai kurang tepat");
  return kosong();
});
