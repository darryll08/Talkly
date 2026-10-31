import type { Kata, Transkrip } from "../../lib/ukur/tipe";

// Pembuat transkrip tiruan untuk tes: setiap baris [pembicara, t_mulai, t_selesai, teks].
// Kata dibagi rata di dalam rentang ucapan.

export type Baris = [pembicara: string, t_mulai: number, t_selesai: number, teks: string];

export function transkrip(baris: Baris[], peristiwa: Transkrip["peristiwa"] = []): Transkrip {
  const kata: Kata[] = [];
  for (const [p, a, b, teks] of baris) {
    const potong = teks.split(/\s+/).filter(Boolean);
    const lebar = (b - a) / potong.length;
    potong.forEach((t, i) =>
      kata.push({ teks: t, t_mulai: a + i * lebar, t_selesai: a + (i + 1) * lebar, pembicara: p, keyakinan: 0.95 }),
    );
  }
  return { penyedia: "scribe", kata, peristiwa };
}

/** Isi rekaman sampai durasi tertentu dengan ucapan perekam yang panjang, supaya lolos mutu. */
export function pengisi(mulai: number, sampai: number, pembicara = "ibu"): Baris[] {
  const hasil: Baris[] = [];
  for (let t = mulai; t + 3 <= sampai; t += 4) hasil.push([pembicara, t, t + 3, "nah sekarang kita main sama sama ya"]);
  return hasil;
}
