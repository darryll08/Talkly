"use client";

// Antrean unggah rekaman di IndexedDB. Rekaman yang gagal terkirim karena sinyal disimpan di ponsel
// dan dikirim otomatis saat online atau saat aplikasi dibuka. id_lokal mencegah unggah ganda di server.

import { simpan, semua, hapus, hitung } from "./idb";
import { unggahMultipart } from "./panggil";

const PATH = "/api/rekaman";
/** 400/413/415/422: server menolak isinya, jangan diulang. */
const TOLAK = new Set([400, 413, 415, 422]);

export type MetaRekaman = { id_lokal: string } & Record<string, unknown>;

type Item = { id_lokal: string; blob: Blob; meta: MetaRekaman; dibuat: number; percobaan: number };

export type HasilUnggah =
  | { status: "terkirim"; rekaman_id: string }
  | { status: "ditolak"; pesan: string }
  | { status: "antre" };

async function kirimSatu(item: Item): Promise<HasilUnggah> {
  const form = new FormData();
  form.append("audio", item.blob, `${item.id_lokal}.webm`);
  form.append("meta", JSON.stringify(item.meta));
  const { status, json, pesan } = await unggahMultipart(PATH, form);
  if (status >= 200 && status < 300) {
    const id = (json as { rekaman_id?: string } | null)?.rekaman_id;
    if (id) return { status: "terkirim", rekaman_id: id };
  }
  if (TOLAK.has(status)) return { status: "ditolak", pesan: pesan ?? "Rekaman tidak dapat dinilai." };
  return { status: "antre" };
}

/** Kirim rekaman sekarang; bila gagal karena jaringan atau server, simpan di antrean. */
export async function unggahRekaman(blob: Blob, meta: MetaRekaman): Promise<HasilUnggah> {
  const item: Item = { id_lokal: meta.id_lokal, blob, meta, dibuat: Date.now(), percobaan: 1 };
  const hasil = await kirimSatu(item);
  if (hasil.status === "antre") {
    await simpan("antrean", item).catch(() => {});
  }
  return hasil;
}

let sedangKirim: Promise<{ terkirim: number; sisa: number }> | null = null;

/** Kirim semua yang mengantre. Aman dipanggil berkali-kali. */
export function kirimAntrean(): Promise<{ terkirim: number; sisa: number }> {
  if (!sedangKirim) {
    sedangKirim = (async () => {
      let terkirim = 0;
      const daftar = await semua<Item>("antrean").catch(() => [] as Item[]);
      for (const item of daftar.sort((a, b) => a.dibuat - b.dibuat)) {
        const h = await kirimSatu(item);
        if (h.status === "antre") {
          await simpan("antrean", { ...item, percobaan: item.percobaan + 1 }).catch(() => {});
          continue;
        }
        await hapus("antrean", item.id_lokal).catch(() => {});
        if (h.status === "terkirim") terkirim++;
      }
      return { terkirim, sisa: await jumlahAntrean() };
    })().finally(() => {
      sedangKirim = null;
    });
  }
  return sedangKirim;
}

export function jumlahAntrean() {
  return hitung("antrean").catch(() => 0);
}

/** Pasang pengirim otomatis: saat online dan saat aplikasi dibuka. */
export function pasangPengirimOtomatis() {
  const kirim = () => {
    if (navigator.onLine) kirimAntrean().catch(() => {});
  };
  kirim();
  window.addEventListener("online", kirim);
  return () => window.removeEventListener("online", kirim);
}

export function idLokalBaru() {
  return crypto.randomUUID();
}
