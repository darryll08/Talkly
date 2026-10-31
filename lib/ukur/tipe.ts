// Bentuk transkrip yang dinormalkan dari Scribe atau Deepgram, dipakai seluruh lib/ukur.

export type Kata = {
  teks: string;
  t_mulai: number;
  t_selesai: number;
  pembicara: string;
  /** 0–1; null bila penyedia tidak memberi. */
  keyakinan: number | null;
};

export type PeristiwaAudio = { jenis: "musik" | "tv" | "tawa" | "lainnya"; t_mulai: number; t_selesai: number };

export type Transkrip = {
  penyedia: "scribe" | "deepgram";
  kata: Kata[];
  peristiwa: PeristiwaAudio[];
};

export type Ucapan = {
  pembicara: string;
  t_mulai: number;
  t_selesai: number;
  teks: string;
  kata: Kata[];
};

export type Rentang = { t_mulai: number; t_selesai: number };
