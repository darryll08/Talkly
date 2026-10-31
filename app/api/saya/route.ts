import { denganAkses } from "@/lib/server/akses";
import { kosong } from "@/lib/server/respons";
import { hapusSemuaSesi } from "@/lib/server/sesi";
import { anakRingkas, anggotaUntukLayar } from "@/lib/keluarga/anggota";

export const GET = denganAkses(["anggota"], async (_req, { saya }) => {
  return Response.json({ anggota: anggotaUntukLayar(saya.anggota), anak: await anakRingkas(saya.anggota.anak_id) });
});

/** Keluar dari ponsel ini. Data anggota tetap ada; hapus akun lewat DELETE /api/anggota/:id. */
export const DELETE = denganAkses(["anggota"], async () => {
  await hapusSemuaSesi();
  return kosong();
});
