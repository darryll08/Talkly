import type { AnggotaSesi } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";

// Data anggota dan anak untuk layar keluarga. Bentuknya mengikuti AnggotaSaya dan AnakRingkas di lib/kontrak/api.ts.

export function anggotaUntukLayar(a: AnggotaSesi) {
  return {
    id: a.id,
    nama: a.nama,
    peran: a.peran,
    pengelola: a.pengelola,
    izin_nilai: a.izin_nilai,
    izin_dengar: a.izin_dengar,
    izin_klip: a.izin_klip,
  };
}

export async function anakRingkas(anakId: string) {
  const { data, error } = await db()
    .from("anak")
    .select("id, nama, tahap, kata_target, terapis:terapis_id (id, nama)")
    .eq("id", anakId)
    .single();
  if (error) throw error;
  const terapis = (Array.isArray(data.terapis) ? data.terapis[0] : data.terapis) as { id: string; nama: string } | null;
  return {
    id: data.id as string,
    nama: data.nama as string,
    tahap: data.tahap as number,
    kata_target: data.kata_target as string[],
    terapis: terapis ?? { id: "00000000-0000-4000-8000-000000000000", nama: "Terapis" },
  };
}

/** Sapaan untuk templat umpan balik: peran keluarga, atau nama untuk pengasuh dan lainnya. */
export function sapaan(peran: string, nama: string): string {
  const p: Record<string, string> = { ibu: "Ibu", ayah: "Ayah", nenek: "Nenek", kakek: "Kakek" };
  return p[peran] ?? nama;
}
