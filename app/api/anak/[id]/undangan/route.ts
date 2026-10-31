import { cekTerapisMenangani, denganAkses } from "@/lib/server/akses";
import { galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";

// D2: daftar undangan satu anak beserta statusnya.

export const GET = denganAkses(["terapis"], async (_req, { saya, params }) => {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return galat(404, "Data anak tidak ditemukan.");
  const tolak = await cekTerapisMenangani(saya.terapis.id, params.id);
  if (tolak) return tolak;
  const { data, error } = await db()
    .from("undangan")
    .select("id, peran, kedaluwarsa, dipakai_oleh, pemakai:dipakai_oleh (nama)")
    .eq("anak_id", params.id)
    .order("dibuat", { ascending: false });
  if (error) throw error;
  return Response.json({
    undangan: (data ?? []).map((u) => {
      const p = (Array.isArray(u.pemakai) ? u.pemakai[0] : u.pemakai) as { nama: string } | null;
      return {
        id: u.id,
        peran: u.peran,
        status: u.dipakai_oleh ? "dipakai" : Date.parse(u.kedaluwarsa) < Date.now() ? "kedaluwarsa" : "menunggu",
        kedaluwarsa: u.kedaluwarsa,
        dipakai_oleh: p?.nama ?? null,
      };
    }),
  });
});
