import { db } from "@/lib/server/supabase";

// Pesan dua arah keluarga ↔ terapis untuk satu anak (Pesan di ponsel, D6 di dasbor).

export async function daftarPesan(anakId: string) {
  const { data, error } = await db()
    .from("pesan")
    .select("id, isi, konteks, dibuat, anggota:pengirim_anggota (nama), terapis:pengirim_terapis (nama)")
    .eq("anak_id", anakId)
    .order("dibuat", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map(bentuk);
}

export function bentuk(p: { id: string; isi: string; konteks: string | null; dibuat: string; anggota: unknown; terapis: unknown }) {
  const a = (Array.isArray(p.anggota) ? p.anggota[0] : p.anggota) as { nama: string } | null;
  const t = (Array.isArray(p.terapis) ? p.terapis[0] : p.terapis) as { nama: string } | null;
  return { id: p.id, dari: a ? ("keluarga" as const) : ("terapis" as const), nama: a?.nama ?? t?.nama ?? "", isi: p.isi, konteks: p.konteks, dibuat: p.dibuat };
}

export async function kirimPesan(anakId: string, dari: { anggota?: string; terapis?: string }, isi: string, konteks?: string) {
  const { data, error } = await db()
    .from("pesan")
    .insert({ anak_id: anakId, pengirim_anggota: dari.anggota ?? null, pengirim_terapis: dari.terapis ?? null, isi, konteks: konteks ?? null })
    .select("id, isi, konteks, dibuat, anggota:pengirim_anggota (nama), terapis:pengirim_terapis (nama)")
    .single();
  if (error) throw error;
  return bentuk(data);
}
