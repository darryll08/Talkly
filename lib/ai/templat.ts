import daftar from "@/data/templat.json";
import { DaftarTemplat, type Templat } from "@/lib/kontrak/konten";
import type { Ukuran } from "@/lib/kontrak/hasil";

// Pemilihan kandidat templat oleh kode dari ukuran, lalu pengisian isian. AI hanya memilih dari kandidat.

export const TEMPLAT: Templat[] = DaftarTemplat.parse(daftar);

type UkuranTanpaAi = Omit<Ukuran, "perluasan_ai">;

export function kandidat(u: UkuranTanpaAi): { pujian: Templat[]; saran: Templat[] } {
  const cocokPujian: Record<string, boolean> = {
    menunggu_cukup: u.ajakan_berhasil >= 1,
    anak_merespons: u.vokalisasi_anak >= 1,
    giliran: u.giliran >= 1,
    perluasan: u.vokalisasi_anak >= 1,
    kata_target: u.ucapan_kata_target >= 2,
    tanpa_suruhan: u.suruhan_beruntun === 0 && u.jumlah_ajakan >= 3,
    kalimat_pendek: true,
    ikuti_minat: true,
    umum: true,
  };
  const cocokSaran: Record<string, boolean> = {
    memotong: u.memotong >= 1 && (u.jeda_rata_s ?? 0) < 4,
    suruhan_beruntun: u.suruhan_beruntun >= 1,
    pertanyaan_beruntun: u.pertanyaan_beruntun >= 1,
    kata_target_jarang: u.ucapan_kata_target <= 1,
    ajakan_sedikit: u.jumlah_ajakan < 4,
    perluasan_kurang: u.vokalisasi_anak >= 1,
    tanggapi_suara: u.vokalisasi_anak > u.giliran,
    kalimat_panjang: true,
    umum: true,
  };
  return {
    pujian: TEMPLAT.filter((t) => t.jenis === "pujian" && cocokPujian[t.pemicu]),
    saran: TEMPLAT.filter((t) => t.jenis === "saran" && cocokSaran[t.pemicu]),
  };
}

/** Urutan pilihan cadangan bila AI gagal. Templat yang butuh {kutipan} dilewati. */
const PRIORITAS_PUJIAN = ["anak_merespons", "giliran", "menunggu_cukup", "kata_target", "tanpa_suruhan", "umum"];
const PRIORITAS_SARAN = ["suruhan_beruntun", "memotong", "pertanyaan_beruntun", "tanggapi_suara", "kata_target_jarang", "ajakan_sedikit", "umum"];

export function pilihCadangan(u: UkuranTanpaAi): { pujian: Templat; saran: Templat } {
  const k = kandidat(u);
  const tanpaKutipan = (t: Templat) => !t.teks.includes("{kutipan}");
  const pilih = (calon: Templat[], urutan: string[]) =>
    urutan.map((p) => calon.find((t) => t.pemicu === p && tanpaKutipan(t))).find(Boolean)!;
  return { pujian: pilih(k.pujian, PRIORITAS_PUJIAN), saran: pilih(k.saran, PRIORITAS_SARAN) };
}

const koma = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

export type Isian = { sapaan: string; anak: string; kata: string; ukuran: UkuranTanpaAi; kutipan: string };

/** Isi templat. Angka selalu dari kode; {jumlah} mengikuti pemicu templat. */
export function isiTemplat(t: Templat, x: Isian): string {
  const u = x.ukuran;
  const jumlah: Record<string, number> = {
    menunggu_cukup: u.ajakan_berhasil,
    anak_merespons: u.vokalisasi_anak,
    kata_target: u.ucapan_kata_target,
  };
  const nilai: Record<string, string> = {
    sapaan: x.sapaan,
    anak: x.anak,
    kata: x.kata,
    jeda: koma(u.jeda_rata_s ?? 0),
    jumlah: String(jumlah[t.pemicu] ?? u.jumlah_ajakan),
    giliran: String(u.giliran),
    kutipan: x.kutipan,
  };
  const teks = t.teks.replace(/\{(\w+)\}/g, (_, k: string) => nilai[k] ?? "");
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}
