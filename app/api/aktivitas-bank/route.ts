import { denganAkses } from "@/lib/server/akses";
import { BANK } from "@/lib/terapis/program";

// D1 dan D5: bank aktivitas untuk dipilih terapis.
export const GET = denganAkses(["terapis"], async () => {
  return Response.json({ aktivitas: BANK.map(({ id, judul, rutinitas, tahap }) => ({ id, judul, rutinitas, tahap })) });
});
