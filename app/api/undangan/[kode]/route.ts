import { denganAkses } from "@/lib/server/akses";
import { galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";
import { hashUndangan } from "@/lib/keluarga/kode";

// O1/O1b: pratinjau undangan sebelum bergabung ("Raka · Kak Nadia"). Publik; kode tidak pernah disimpan polos.

const satu = <T,>(x: T | T[] | null | undefined) => (Array.isArray(x) ? x[0] : x) ?? null;

export const GET = denganAkses(["publik"], async (_req, { params }) => {
  const { data } = await db()
    .from("undangan")
    .select("peran, kedaluwarsa, dipakai_oleh, anak:anak_id (nama, klinik:klinik_id (nama), terapis:terapis_id (nama))")
    .eq("kode_hash", hashUndangan(params.kode))
    .maybeSingle();
  if (!data) return galat(404, "Kode undangan tidak ditemukan. Periksa lagi hurufnya.");
  const anak = satu(data.anak) as { nama: string; klinik: unknown; terapis: unknown } | null;
  const status = data.dipakai_oleh ? "dipakai" : Date.parse(data.kedaluwarsa) < Date.now() ? "kedaluwarsa" : "menunggu";
  return Response.json({
    status,
    peran: data.peran,
    anak: { nama: anak?.nama ?? "" },
    klinik: { nama: (satu(anak?.klinik) as { nama: string } | null)?.nama ?? "" },
    terapis: { nama: (satu(anak?.terapis) as { nama: string } | null)?.nama ?? "" },
  });
});
