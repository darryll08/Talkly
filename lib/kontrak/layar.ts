import { API, type NamaEndpoint } from "./api";

// Kontrak 2.7: matriks layar → endpoint, diturunkan dari kolom `layar` di api.ts supaya keduanya tidak bisa berbeda.
// I0 lolos bila setiap layar punya endpoint baca (kecuali yang ditandai hanya menulis) dan setiap endpoint dipakai layar.

export const LAYAR = {
  Beranda: { pemilik: "B", hanya_tulis: "Mode demo: hanya memasang sesi persona" },
  O00: { pemilik: "B", hanya_tulis: "Notifikasi pengingat, bukan halaman" },
  O1: { pemilik: "B" },
  O1b: { pemilik: "B" },
  O1c: { pemilik: "B", hanya_tulis: "Masuk dengan kode pribadi sebelum ada sesi" },
  O2: { pemilik: "B" },
  O2b: { pemilik: "B", hanya_tulis: "Menyalakan notifikasi saat pengenalan" },
  O2c: { pemilik: "B", hanya_tulis: "Kode masuk dari balasan POST /api/gabung, tampil sekali" },
  O3: { pemilik: "B" },
  O4: { pemilik: "B" },
  O4b: { pemilik: "B" },
  O5: { pemilik: "B" },
  O5b: { pemilik: "B" },
  O6: { pemilik: "B" },
  O7: { pemilik: "B" },
  O8: { pemilik: "B" },
  O9: { pemilik: "B" },
  O10: { pemilik: "B" },
  O11: { pemilik: "B" },
  O12: { pemilik: "B" },
  O12a: { pemilik: "B" },
  Pesan: { pemilik: "B" },
  "Cek perangkat": { pemilik: "B" },
  "Masuk terapis": { pemilik: "C", hanya_tulis: "Masuk sebelum ada sesi" },
  D1: { pemilik: "C" },
  D2: { pemilik: "C" },
  D3: { pemilik: "C" },
  D4: { pemilik: "C" },
  D5: { pemilik: "C" }, // Setelah sesi (v19; v20 menyebutnya D6)
  D6: { pemilik: "C" }, // Pesan keluarga (v19; v20 menyebutnya D5)
  "Masuk admin": { pemilik: "B", hanya_tulis: "Masuk sebelum ada sesi" },
  A1: { pemilik: "B" }, // Admin: klinik dan akun terapis
} as const satisfies Record<string, { pemilik: "B" | "C"; hanya_tulis?: string }>;

export type KodeLayar = keyof typeof LAYAR;

export type BarisMatriks = { baca: NamaEndpoint[]; tulis: NamaEndpoint[] };

export function matriksLayar(): Record<KodeLayar, BarisMatriks> {
  const m = Object.fromEntries(Object.keys(LAYAR).map((k) => [k, { baca: [], tulis: [] }])) as unknown as Record<
    KodeLayar,
    BarisMatriks
  >;
  for (const [nama, e] of Object.entries(API) as [NamaEndpoint, (typeof API)[NamaEndpoint]][]) {
    for (const l of e.layar as readonly string[]) {
      const baris = m[l as KodeLayar];
      if (!baris) throw new Error(`Endpoint ${nama} menyebut layar ${l} yang tidak ada di LAYAR`);
      (e.metode === "GET" ? baris.baca : baris.tulis).push(nama);
    }
  }
  return m;
}

/** Masalah matriks; kosong berarti syarat I0 terpenuhi. */
export function periksaMatriks(): string[] {
  const masalah: string[] = [];
  const m = matriksLayar();
  for (const [kode, def] of Object.entries(LAYAR) as [KodeLayar, (typeof LAYAR)[KodeLayar]][]) {
    if (m[kode].baca.length === 0 && !("hanya_tulis" in def)) masalah.push(`Layar ${kode} tidak punya endpoint baca`);
  }
  for (const [nama, e] of Object.entries(API)) {
    if (e.layar.length === 0 && !(e.akses as readonly string[]).includes("cron")) masalah.push(`Endpoint ${nama} tidak dipakai layar mana pun`);
  }
  return masalah;
}
