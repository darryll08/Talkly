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
  /** Kata target yang dihubungkan keluarga (bebek, mamam, …), atau LAINNYA untuk benda di luar kata target. */
  untuk_kata?: string;
};

/** Slot kartu di luar kata target. Kartu Lainnya yang dipilih tampil di aktivitas yang belum punya foto kata. */
export const LAINNYA = "*lainnya";

/** Kata yang dipakai untuk mencocokkan kartu dengan kata target aktivitas. */
export const kataKartu = (k: Pick<KartuBenda, "kata" | "untuk_kata">) => k.untuk_kata ?? k.kata;

/** Slot pilihan kartu: kata targetnya bila ada di daftar kata target anak, selain itu Lainnya. */
export const slotKartu = (k: Pick<KartuBenda, "kata" | "untuk_kata">, kataTarget: string[]) =>
  kataTarget.includes(kataKartu(k)) ? kataKartu(k) : LAINNYA;

export async function simpanKartuBenda(k: KartuBenda) {
  await simpan("kartu_benda", k);
}

export async function daftarKartuBenda(): Promise<KartuBenda[]> {
  const d = await semua<KartuBenda>("kartu_benda").catch(() => [] as KartuBenda[]);
  return d.sort((a, b) => b.dibuat - a.dibuat);
}

export const hapusKartuBenda = (id: string) => hapus("kartu_benda", id);

// Kartu yang dipakai di kartu aktivitas, per kata. Tanpa pilihan, kartu terbaru untuk kata itu yang dipakai;
// nilai "" berarti keluarga membatalkan pilihan, jadi kata itu sengaja tampil tanpa foto.
const KUNCI_DIPAKAI = "talkly:kartu-benda-dipakai";

export function kartuDipakai(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_DIPAKAI) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function tulisDipakai(kata: string, id: string) {
  try {
    localStorage.setItem(KUNCI_DIPAKAI, JSON.stringify({ ...kartuDipakai(), [kata]: id }));
  } catch {}
}

/** Pilih kartu untuk slotnya (kata target atau LAINNYA). */
export function pakaiKartuBenda(slot: string, id: string) {
  tulisDipakai(slot, id);
}

/** Kartu dihapus: pilihan yang menunjuk kartu itu dibuang, sehingga kata itu kembali memakai kartu terbaru. */
export function lupakanPilihanKartu(id: string) {
  try {
    const sisa = Object.fromEntries(Object.entries(kartuDipakai()).filter(([, v]) => v !== id));
    localStorage.setItem(KUNCI_DIPAKAI, JSON.stringify(sisa));
  } catch {}
}

/** Batal pilih: kata ini tampil tanpa foto sampai keluarga memilih kartu lagi. */
export function lepasKartuBenda(kata: string) {
  tulisDipakai(kata, "");
}

/** Kartu yang tampil untuk satu kata: pilihan keluarga, atau yang terbaru bila belum pernah dipilih. */
export function kartuUntukKata(daftar: KartuBenda[], kata: string, pilihan = kartuDipakai()): KartuBenda | undefined {
  if (kata in pilihan) return pilihan[kata] ? daftar.find((x) => x.id === pilihan[kata]) : undefined;
  // Kartu Lainnya hanya tampil bila dipilih keluarga.
  return kata === LAINNYA ? undefined : daftar.find((x) => kataKartu(x) === kata);
}

/** Kartu untuk aktivitas: foto kata target pertama yang ada, lalu kartu Lainnya yang dipilih. */
export function pilihKartuUntuk(daftar: KartuBenda[], kata: string[]): KartuBenda | undefined {
  const pilihan = kartuDipakai();
  for (const k of kata) {
    const kartu = kartuUntukKata(daftar, k, pilihan);
    if (kartu) return kartu;
  }
  return kartuUntukKata(daftar, LAINNYA, pilihan);
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
