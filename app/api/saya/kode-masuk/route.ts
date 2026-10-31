import { denganAkses } from "@/lib/server/akses";
import { pasangKodeMasuk } from "@/lib/keluarga/anggota-baru";

// O12: ganti kode masuk pribadi. Kode lama langsung tidak berlaku.

export const POST = denganAkses(["anggota"], async (_req, { saya }) => {
  return Response.json({ kode_masuk: await pasangKodeMasuk(saya.anggota.id) });
});
