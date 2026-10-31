import { kataTerlarangDi } from "@/lib/kontrak/konten";

// Pemeriksaan keluaran AI oleh kode (proposal 4.3). Kosong = lolos.

/** Batas kata kalimat versi anak per tahap. */
export const MAKS_KATA_VERSI_ANAK: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 8 };

export const normal = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export type KeluaranAi = {
  pujian_id: string;
  saran_id: string;
  kutipan: string;
  versi_anak: string;
  perluasan_ai: number;
  laporan_terapis: string;
  ragu: boolean;
};

export function periksaKeluaran(
  k: KeluaranAi,
  ctx: {
    pujianBoleh: string[];
    saranBoleh: string[];
    butuhKutipan: boolean;
    transkripPerekam: string;
    tahap: number;
    kataTarget: string[];
    vokalisasiAnak: number;
  },
): string[] {
  const masalah: string[] = [];
  if (k.ragu) masalah.push("AI menandai ragu");
  if (!ctx.pujianBoleh.includes(k.pujian_id)) masalah.push(`pujian ${k.pujian_id} bukan kandidat`);
  if (!ctx.saranBoleh.includes(k.saran_id)) masalah.push(`saran ${k.saran_id} bukan kandidat`);

  const kutipan = normal(k.kutipan);
  if (ctx.butuhKutipan && !kutipan) masalah.push("kutipan kosong padahal templat membutuhkannya");
  if (kutipan && !normal(ctx.transkripPerekam).includes(kutipan)) masalah.push("kutipan tidak ada di transkrip");

  const versi = k.versi_anak.trim();
  const kata = normal(versi).split(" ").filter(Boolean);
  const maks = MAKS_KATA_VERSI_ANAK[ctx.tahap] ?? 8;
  if (kata.length === 0) masalah.push("versi anak kosong");
  if (kata.length > maks) masalah.push(`versi anak ${kata.length} kata, batas tahap ${ctx.tahap} = ${maks}`);
  if (ctx.tahap === 1 && versi.includes("?")) masalah.push("versi anak tahap 1 memakai tanda tanya");
  if (/\bayo\b|\bbilang\b/i.test(versi)) masalah.push("versi anak berisi suruhan");
  if (ctx.tahap <= 2 && !ctx.kataTarget.some((t) => kata.includes(t.toLowerCase()))) masalah.push("versi anak tanpa kata target");

  if (k.perluasan_ai < 0 || k.perluasan_ai > ctx.vokalisasiAnak) masalah.push("perluasan di luar rentang");

  // Laporan terapis hanya dicek kata diagnosis/skor, karena frasa umum seperti "salah satu" wajar di sana.
  const terlarang = [
    ...[versi, k.kutipan].flatMap(kataTerlarangDi),
    ...kataTerlarangDi(k.laporan_terapis).filter((t) => ["autis", "autisme", "diagnosis", "skor"].includes(t)),
  ];
  if (terlarang.length) masalah.push(`kata terlarang: ${[...new Set(terlarang)].join(", ")}`);
  return masalah;
}
