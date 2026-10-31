import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

// Kode undangan (8 karakter, SHA-256, sekali pakai, 7 hari) dan kode masuk pribadi (12 karakter, bcrypt).
// Alfabet tanpa huruf yang mudah tertukar: 0/O, 1/I/L.

const ALFABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const HARI_UNDANGAN = 7;
export const MAKS_ANGGOTA = 4;

function acak(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += ALFABET[randomInt(ALFABET.length)];
  return s;
}

/** Rapikan masukan pengguna: huruf besar, buang spasi dan tanda hubung. */
export const rapikan = (kode: string) => kode.toUpperCase().replace(/[^A-Z0-9]/g, "");

export function buatKodeUndangan() {
  return acak(8);
}

export function hashUndangan(kode: string) {
  return createHash("sha256").update(rapikan(kode)).digest("hex");
}

/**
 * Kode masuk "ABCD-EFGH-JKMN": empat karakter pertama = kode_masuk_id (untuk mencari baris),
 * seluruh kode dicocokkan dengan bcrypt.
 */
export async function buatKodeMasuk() {
  const id = acak(4);
  const kode = `${id}-${acak(4)}-${acak(4)}`;
  return { kode, id, hash: await bcrypt.hash(rapikan(kode), 10) };
}

export function idKodeMasuk(kode: string) {
  return rapikan(kode).slice(0, 4);
}

export function cocokKodeMasuk(kode: string, hash: string) {
  return bcrypt.compare(rapikan(kode), hash);
}
