import { z } from "zod";

// Kontrak 2.3: JSON hasil satu rekaman, disimpan di hasil_rekaman.hasil.
// Satu objek ini menjadi sumber O6 (umpan balik), O10 (kemajuan), dan D4 (kartu anak).
// Nama kategori ajakan mengikuti Gambar 8 proposal: anak merespons, menunggu cukup, memotong.

export const KategoriAjakan = z.enum(["anak_merespons", "menunggu_cukup", "memotong"]);
export type KategoriAjakan = z.infer<typeof KategoriAjakan>;

export const Ajakan = z.object({
  t_mulai: z.number(),
  t_selesai: z.number(),
  teks: z.string(),
  kategori: KategoriAjakan,
  /** Detik sampai suara berikutnya (atau dari tombol "saya mulai menunggu"). */
  jeda_s: z.number(),
});
export type Ajakan = z.infer<typeof Ajakan>;

export const Mutu = z.object({
  lolos: z.boolean(),
  /** Alasan tolak berbahasa sehari-hari beserta cara memperbaikinya (O7). null bila lolos. */
  alasan: z.string().nullable(),
  durasi_s: z.number(),
  kata_perekam: z.number(),
});
export type Mutu = z.infer<typeof Mutu>;

export const Ukuran = z.object({
  jumlah_ajakan: z.number(),
  ajakan_berhasil: z.number(),
  memotong: z.number(),
  jeda_rata_s: z.number().nullable(),
  giliran: z.number(),
  vokalisasi_anak: z.number(),
  ucapan_kata_target: z.number(),
  pertanyaan_beruntun: z.number(),
  suruhan_beruntun: z.number(),
  perluasan_ai: z.number(),
});
export type Ukuran = z.infer<typeof Ukuran>;

export const Momen = z.object({ t_mulai: z.number(), t_selesai: z.number() });
export type Momen = z.infer<typeof Momen>;

export const UmpanBalik = z.object({
  pujian_id: z.string(),
  saran_id: z.string(),
  /** Templat yang sudah diisi server; layar tidak merangkai kalimat sendiri. */
  teks_pujian: z.string(),
  teks_saran: z.string(),
  kutipan: z.string(),
  versi_anak: z.string(),
  momen: Momen.nullable(),
  sumber: z.enum(["ai", "cadangan"]),
});
export type UmpanBalik = z.infer<typeof UmpanBalik>;

/** Suara anak untuk pita percakapan D4. */
export const SuaraAnak = z.object({ t_mulai: z.number(), t_selesai: z.number() });

export const HasilRekaman = z.object({
  rekaman_id: z.string(),
  mutu: Mutu,
  stt: z.object({
    penyedia: z.enum(["scribe", "deepgram", "tidak_ada"]),
    sumber_suara_anak: z.enum(["label", "celah_hening", "tidak_ada"]),
  }),
  ajakan: z.array(Ajakan),
  suara_anak: z.array(SuaraAnak),
  ukuran: Ukuran.nullable(), // null bila ditolak
  umpan_balik: UmpanBalik.nullable(), // null bila ditolak
  laporan_terapis: z.string().nullable(),
  naikkan_status: z.boolean(),
});
export type HasilRekaman = z.infer<typeof HasilRekaman>;
