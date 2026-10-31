import { z } from "zod";

// Skema bank aktivitas (data/aktivitas.json) dan templat umpan balik (data/templat.json).
// Isi keduanya perlu ditinjau terapis sebelum pilot (proposal 6.3).

export const KATA_TERLARANG = [
  "hp",
  "video",
  "hukuman",
  "salah",
  "gagal",
  "autis",
  "autisme",
  "diagnosis",
  "terlambat",
  "skor",
  "nilai",
] as const;

/** Kata terlarang yang muncul sebagai kata utuh dalam teks (tanpa memedulikan huruf besar). */
export function kataTerlarangDi(teks: string): string[] {
  const kata: string[] = teks.toLowerCase().match(/[a-z]+/g) ?? [];
  return KATA_TERLARANG.filter((t) => kata.includes(t));
}

export const Rutinitas = z.enum(["mandi", "makan", "bermain", "berpakaian", "berbelanja", "tidur"]);

export const Aktivitas = z.object({
  id: z.string().regex(/^[A-Z]+-\d{2}$/),
  judul: z.string().min(3).max(60),
  rutinitas: Rutinitas,
  tahap: z.number().int().min(1).max(4),
  /** Tiga langkah utama, terbaca sekitar 15 detik. {kata} diganti kata target anak. */
  langkah: z.array(z.string().min(5).max(140)).length(3),
  bila_mencoba: z.string().min(5).max(160),
  bila_belum: z.string().min(5).max(160),
});
export type Aktivitas = z.infer<typeof Aktivitas>;

export const BankAktivitas = z.array(Aktivitas).min(10);

/** Ukuran yang membuat templat dipilih. Dicocokkan oleh kode sebelum daftar templat dikirim ke AI. */
export const PemicuPujian = z.enum([
  "menunggu_cukup",
  "anak_merespons",
  "giliran",
  "perluasan",
  "kata_target",
  "tanpa_suruhan",
  "kalimat_pendek",
  "ikuti_minat",
  "umum",
]);
export const PemicuSaran = z.enum([
  "memotong",
  "suruhan_beruntun",
  "pertanyaan_beruntun",
  "kata_target_jarang",
  "ajakan_sedikit",
  "perluasan_kurang",
  "tanggapi_suara",
  "kalimat_panjang",
  "umum",
]);

/** Isian yang boleh ada di teks templat. Angka diisi kode, {kutipan} dari AI yang sudah divalidasi. */
export const ISIAN = ["sapaan", "anak", "kata", "jeda", "jumlah", "giliran", "kutipan"] as const;

const TeksTemplat = z
  .string()
  .min(20)
  .max(240)
  .refine((t) => [...t.matchAll(/\{(\w+)\}/g)].every((m) => (ISIAN as readonly string[]).includes(m[1])), {
    message: "isian tidak dikenal",
  });

export const Templat = z.discriminatedUnion("jenis", [
  z.object({ id: z.string().regex(/^P\d{2}$/), jenis: z.literal("pujian"), pemicu: PemicuPujian, teks: TeksTemplat }),
  z.object({ id: z.string().regex(/^S\d{2}$/), jenis: z.literal("saran"), pemicu: PemicuSaran, teks: TeksTemplat }),
]);
export type Templat = z.infer<typeof Templat>;

export const DaftarTemplat = z.array(Templat).length(18);
