import { cookies } from "next/headers";
import { tandatangani, verifikasi } from "./tanda";

// Cookie sesi keluarga dan terapis: id + tanda HMAC, httpOnly, secure, sameSite=lax, 180 hari.

export const COOKIE = {
  anggota: "talkly_anggota",
  terapis: "talkly_terapis",
  admin: "talkly_admin",
} as const;

export type JenisSesi = keyof typeof COOKIE;

const UMUR_S = 180 * 24 * 60 * 60;

export async function pasangSesi(jenis: JenisSesi, id: string) {
  const jar = await cookies();
  jar.set(COOKIE[jenis], tandatangani(id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UMUR_S,
  });
}

export async function bacaSesi(jenis: JenisSesi): Promise<string | null> {
  const jar = await cookies();
  return verifikasi(jar.get(COOKIE[jenis])?.value);
}

/** Dipakai mode demo dan keluar supaya tidak ada sesi peran lain yang tertinggal (K9). */
export async function hapusSemuaSesi() {
  const jar = await cookies();
  for (const nama of Object.values(COOKIE)) jar.delete(nama);
}
