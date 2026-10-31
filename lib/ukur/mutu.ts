import type { Mutu } from "@/lib/kontrak/hasil";
import type { PeristiwaAudio, Ucapan } from "./tipe";

// Pemeriksaan mutu rekaman (proposal S2): ≥ 40 detik, ≥ 15 kata perekam, tidak terputus,
// TV/musik tidak dominan. Alasan tolak berbahasa sehari-hari dan menyebut cara memperbaikinya (O7).

export const DURASI_MIN_S = 40;
export const KATA_PEREKAM_MIN = 15;
export const PORSI_BISING_MAKS = 0.3;

export function periksaMutu(input: {
  durasi_s: number;
  terputus: boolean;
  ucapan: Ucapan[];
  perekam: string | null;
  peristiwa: PeristiwaAudio[];
}): Mutu {
  const kataPerekam = input.ucapan.filter((u) => u.pembicara === input.perekam).reduce((n, u) => n + u.kata.length, 0);
  const dasar = { durasi_s: Math.round(input.durasi_s * 10) / 10, kata_perekam: kataPerekam };

  if (input.terputus) {
    return {
      ...dasar,
      lolos: false,
      alasan: "Rekaman terhenti di tengah jalan karena layar mati atau aplikasi ditinggal. Biarkan layar tetap menyala selama satu menit.",
    };
  }
  if (input.durasi_s < DURASI_MIN_S) {
    return {
      ...dasar,
      lolos: false,
      alasan: `Rekaman baru ${Math.round(input.durasi_s)} detik. Rekam sampai cincin hampir penuh, paling tidak 40 detik.`,
    };
  }
  const bising = input.peristiwa
    .filter((p) => p.jenis === "musik" || p.jenis === "tv")
    .reduce((n, p) => n + Math.max(0, p.t_selesai - p.t_mulai), 0);
  if (bising / input.durasi_s >= PORSI_BISING_MAKS) {
    return {
      ...dasar,
      lolos: false,
      alasan: "Suara TV atau musik terlalu keras sehingga percakapan tertutup. Matikan TV atau musik dulu, lalu rekam lagi.",
    };
  }
  if (kataPerekam < KATA_PEREKAM_MIN) {
    return {
      ...dasar,
      lolos: false,
      alasan: `Suara orang tua kurang terdengar: hanya ${kataPerekam} kata tertangkap. Taruh ponsel lebih dekat dan terus ajak bicara seperti ke balita.`,
    };
  }
  return { ...dasar, lolos: true, alasan: null };
}
