import type { Mutu } from "@/lib/kontrak/hasil";
import type { PeristiwaAudio, Ucapan } from "./tipe";

// Pemeriksaan mutu rekaman (proposal S2): ≥ 40 detik, ≥ 15 kata perekam, tidak terputus,
// TV/musik tidak dominan. Alasan tolak berbahasa sehari-hari dan menyebut cara memperbaikinya (O7).

export const DURASI_MIN_S = 40;
export const KATA_PEREKAM_MIN = 15;
export const PORSI_BISING_MAKS = 0.3;
// Cadangan bila Scribe tidak menandai musik yang menumpuk dengan suara bicara: dari jejak level ponsel,
// sela tanpa kata yang hampir sekeras bicara berarti ada TV/musik di latar.
export const SELA_BISING_DBFS = -24;
export const SELA_BISING_SELISIH_DB = -8;
const SELA_MIN_S = 5;
const LANGKAH_JEJAK_S = 0.05;

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

/** Level median di sela tanpa kata dan saat bicara, dari jejak [detik, dBFS, f0]. null bila sela terlalu sedikit. */
export function levelSela(ucapan: Ucapan[], jejak: [number, number, number][]) {
  const kata = ucapan.flatMap((u) => u.kata);
  const bicara = (t: number) => kata.some((k) => t >= k.t_mulai - 0.15 && t <= k.t_selesai + 0.15);
  const sela: number[] = [];
  const ucap: number[] = [];
  for (const [t, db] of jejak) {
    if (t < 0.5) continue;
    (bicara(t) ? ucap : sela).push(db);
  }
  if (sela.length * LANGKAH_JEJAK_S < SELA_MIN_S || ucap.length === 0) return null;
  return { sela_dbfs: median(sela), ucap_dbfs: median(ucap) };
}

export function periksaMutu(input: {
  durasi_s: number;
  terputus: boolean;
  ucapan: Ucapan[];
  perekam: string | null;
  peristiwa: PeristiwaAudio[];
  jejak?: [number, number, number][];
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
  const lv = input.jejak?.length ? levelSela(input.ucapan, input.jejak) : null;
  const latarKeras = !!lv && lv.sela_dbfs >= SELA_BISING_DBFS && lv.sela_dbfs - lv.ucap_dbfs >= SELA_BISING_SELISIH_DB;
  if (bising / input.durasi_s >= PORSI_BISING_MAKS || latarKeras) {
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
