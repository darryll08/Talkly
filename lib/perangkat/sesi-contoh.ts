// Mode data contoh (NEXT_PUBLIC_PAKAI_CONTOH=1) tidak punya server yang memasang cookie sesi.
// Penanda ini meniru cookie itu supaya proxy.ts tetap menjaga rute seperti di produksi. /keluar menghapusnya.

import { PAKAI_CONTOH } from "./panggil";

export type JenisSesi = "anggota" | "terapis" | "admin";

export function tandaiMasukContoh(jenis: JenisSesi) {
  if (!PAKAI_CONTOH) return;
  for (const j of ["anggota", "terapis", "admin"]) document.cookie = `talkly_${j}=; path=/; max-age=0`;
  document.cookie = `talkly_${jenis}=contoh; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

/** Pindah ke /keluar (route handler, bukan halaman). Dimuat ulang penuh agar cache layar (useSaya) ikut kosong. */
export function keluarSekarang(sebagai?: "terapis" | "admin") {
  try {
    localStorage.removeItem("talkly:contoh-persona");
  } catch {}
  window.location.replace(`/keluar?selesai=1${sebagai ? `&sebagai=${sebagai}` : ""}`);
}
