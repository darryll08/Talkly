import type { StatusAnak } from "@/lib/kontrak/api";
import { db } from "@/lib/server/supabase";

// Status anak hanya bisa naik lewat sistem (Tabel 2). Turun hanya lewat tindakan terapis di Setelah sesi.

export const URUTAN_STATUS: StatusAnak[] = ["lanjut", "terapis_meninjau", "bahas_minggu_ini"];

export function lebihTinggi(a: StatusAnak, b: StatusAnak): boolean {
  return URUTAN_STATUS.indexOf(a) > URUTAN_STATUS.indexOf(b);
}

/** Naikkan status bila lebih tinggi dari sekarang, dan catat pemicunya. Mengembalikan true bila berubah. */
export async function naikkanStatus(anakId: string, status: StatusAnak, pemicu: string): Promise<boolean> {
  const { data } = await db().from("anak").select("status").eq("id", anakId).single();
  if (!data || !lebihTinggi(status, data.status as StatusAnak)) return false;
  const waktu = new Date().toISOString();
  await db().from("anak").update({ status, status_pemicu: pemicu, status_sejak: waktu }).eq("id", anakId);
  await db().from("riwayat_status").insert({ anak_id: anakId, status, pemicu, waktu });
  return true;
}
