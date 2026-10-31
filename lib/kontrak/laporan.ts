import { z } from "zod";

// Kontrak 2.4: laporan keluarga. Satu skema dipakai saat menulis (POST /api/laporan)
// dan saat membaca (kartu anak D4, kemajuan O10), supaya bentuk `isi` tidak pernah berbeda (K4).

export const Kondisi = z.enum(["sehat", "demam", "batuk_pilek", "rewel", "lainnya"]);

export const CatatanMalam = z.object({
  jenis: z.literal("catatan_malam"),
  isi: z.object({
    /** Kata yang diucapkan anak hari ini, diketik keluarga atau dipilih dari kata target. */
    kata_baru: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    /** Catatan bebas; AI mengekstrak ucapan anak dari sini (A4.3). */
    catatan: z.string().max(1000).default(""),
    kondisi: Kondisi.default("sehat"),
    regresi: z.boolean().default(false),
    lebih_sedikit_bersuara: z.boolean().default(false),
    pesan_untuk_terapis: z.string().max(1000).optional(),
  }),
});

export const CeritakanSendiri = z.object({
  jenis: z.literal("ceritakan_sendiri"),
  isi: z.object({
    aktivitas_id: z.string().nullable().default(null),
    /** Apa yang dilakukan dan bagaimana anak merespons. Tidak masuk angka terukur. */
    cerita: z.string().trim().min(1).max(1000),
    anak_bersuara: z.enum(["ya", "sedikit", "belum"]),
    /** "Pesan untuk Kak <terapis>": bila diisi juga masuk Pesan keluarga dengan konteks "Ceritakan sendiri <tanggal>". */
    pesan_untuk_terapis: z.string().max(1000).optional(),
  }),
});

export const Laporan = z.discriminatedUnion("jenis", [CatatanMalam, CeritakanSendiri]);
export type Laporan = z.infer<typeof Laporan>;
export type JenisLaporan = Laporan["jenis"];
