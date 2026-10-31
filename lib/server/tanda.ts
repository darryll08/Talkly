import { createHmac, timingSafeEqual } from "node:crypto";

// Tanda tangan nilai cookie sesi: "<id>.<hmac-sha256 base64url>" dengan SESI_RAHASIA.
// Dipisah dari sesi.ts supaya bisa dites tanpa next/headers.

function rahasia(): string {
  const r = process.env.SESI_RAHASIA;
  if (!r || r.length < 16) throw new Error("SESI_RAHASIA belum diisi (minimal 16 karakter)");
  return r;
}

function hmac(isi: string): string {
  return createHmac("sha256", rahasia()).update(isi).digest("base64url");
}

export function tandatangani(id: string): string {
  return `${id}.${hmac(id)}`;
}

/** Mengembalikan id bila tanda tangan cocok, selain itu null. */
export function verifikasi(nilai: string | undefined | null): string | null {
  if (!nilai) return null;
  const titik = nilai.lastIndexOf(".");
  if (titik <= 0) return null;
  const id = nilai.slice(0, titik);
  const a = Buffer.from(nilai.slice(titik + 1));
  const b = Buffer.from(hmac(id));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
