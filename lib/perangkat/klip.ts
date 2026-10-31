"use client";

// Penyimpanan lokal: audio rekaman terakhir untuk Momen anak (maks. 10, yang tertua dihapus)
// dan kartu foto benda (foto diperkecil ke sisi 900 px, JPEG 0,85). Tidak pernah dikirim ke server.

import { simpan, ambil, semua, hapus } from "./idb";

const MAKS_KLIP = 10;

type Klip = { rekaman_id: string; blob: Blob; dibuat: number };

export async function simpanKlip(rekaman_id: string, blob: Blob) {
  await simpan<Klip>("klip", { rekaman_id, blob, dibuat: Date.now() });
  const daftar = await semua<Klip>("klip");
  const lebih = daftar.sort((a, b) => b.dibuat - a.dibuat).slice(MAKS_KLIP);
  await Promise.all(lebih.map((k) => hapus("klip", k.rekaman_id)));
}

export async function ambilKlip(rekaman_id: string): Promise<Blob | null> {
  const k = await ambil<Klip>("klip", rekaman_id).catch(() => undefined);
  return k?.blob ?? null;
}

export type KartuBenda = {
  id: string;
  nama_benda: string;
  kata: string;
  contoh_kalimat: string[];
  foto: Blob;
  dibuat: number;
};

export async function simpanKartuBenda(k: KartuBenda) {
  await simpan("kartu_benda", k);
}

export async function daftarKartuBenda(): Promise<KartuBenda[]> {
  const d = await semua<KartuBenda>("kartu_benda").catch(() => [] as KartuBenda[]);
  return d.sort((a, b) => b.dibuat - a.dibuat);
}

export const hapusKartuBenda = (id: string) => hapus("kartu_benda", id);

// Kartu yang dipakai di kartu aktivitas, per kata. Tanpa pilihan, kartu terbaru untuk kata itu yang dipakai.
const KUNCI_DIPAKAI = "talkly:kartu-benda-dipakai";

export function kartuDipakai(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_DIPAKAI) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function pakaiKartuBenda(k: Pick<KartuBenda, "id" | "kata">) {
  try {
    localStorage.setItem(KUNCI_DIPAKAI, JSON.stringify({ ...kartuDipakai(), [k.kata]: k.id }));
  } catch {}
}

/** Kartu untuk salah satu kata: yang dipilih keluarga dulu, lalu yang terbaru. */
export function pilihKartuUntuk(daftar: KartuBenda[], kata: string[]): KartuBenda | undefined {
  const pilihan = kartuDipakai();
  for (const k of kata) {
    const dipilih = daftar.find((x) => x.id === pilihan[k]);
    if (dipilih) return dipilih;
  }
  return daftar.find((x) => kata.includes(x.kata));
}

/** Perkecil foto ke sisi terpanjang 900 px, JPEG kualitas 0,85. */
export async function perkecilFoto(berkas: Blob, sisi = 900): Promise<Blob> {
  const bmp = await createImageBitmap(berkas);
  const skala = Math.min(1, sisi / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * skala);
  const h = Math.round(bmp.height * skala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((ok, gagal) =>
    canvas.toBlob((b) => (b ? ok(b) : gagal(new Error("Foto tidak bisa diproses."))), "image/jpeg", 0.85),
  );
}
