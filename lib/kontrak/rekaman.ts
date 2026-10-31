import { z } from "zod";

// Kontrak 2.2: meta unggah satu rekaman dari ponsel (form-data `meta`, berkas di `audio`).
// Bentuknya mengikuti HasilRekam di lib/perangkat/use-rekam.ts.
// Balasan: 2xx berisi rekaman_id; 400/413/415/422 = jangan diulang; kode lain = simpan di antrean ponsel.

/** Satu frame jejak nada dari AudioWorklet: [detik, dBFS, f0]. f0 = 0 bila tidak bersuara. */
export const FrameJejak = z.tuple([z.number(), z.number(), z.number()]);

export const KandidatSuaraAnak = z.object({
  t_mulai: z.number(),
  t_selesai: z.number(),
  f0_rata: z.number(),
});
export type KandidatSuaraAnak = z.infer<typeof KandidatSuaraAnak>;

export const MetaRekaman = z.object({
  id_lokal: z.string().min(8).max(64),
  perekam_id: z.uuid(),
  rencana_item_id: z.uuid().nullable().optional(),
  durasi_s: z.number().min(0).max(120),
  terputus: z.boolean(),
  mulai_menunggu_s: z.array(z.number().min(0)).max(60).default([]),
  rekaman_cadangan: z.boolean().default(false),
  jejak: z.array(FrameJejak).max(5000).default([]),
  kandidat_suara_anak: z.array(KandidatSuaraAnak).max(500).default([]),
});
export type MetaRekaman = z.infer<typeof MetaRekaman>;

export const BATAS_UKURAN_AUDIO = 5 * 1024 * 1024;
export const MIME_AUDIO = ["audio/webm", "audio/ogg"] as const;

/** Kode balasan unggah yang berarti ponsel tidak perlu mengulang. */
export const JANGAN_ULANGI = [400, 413, 415, 422] as const;
