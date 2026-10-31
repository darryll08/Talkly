import type { Ajakan, Momen, Ukuran } from "@/lib/kontrak/hasil";
import type { Peran } from "./pembicara";
import type { Rentang, Ucapan } from "./tipe";

// Mesin pengukuran (proposal 4.1). Semua angka di layar berasal dari sini, bukan dari AI.
//   Ajakan   = ucapan perekam yang diakhiri "?", memuat kata target, diikuti hening ≥ 1 detik,
//              atau ditandai tombol "saya mulai menunggu".
//   Kategori = anak_merespons (anak bersuara sebelum perekam bicara lagi),
//              menunggu_cukup (hening ≥ AMBANG_S), memotong (perekam bicara lagi sebelum AMBANG_S).
//   Suara dewasa lain mengakhiri jeda; ajakan yang disela dewasa lain sebelum ambang tidak dinilai.
//   Giliran  = ajakan → anak bersuara → perekam menanggapi dalam ≤ 5 detik.

export const AMBANG_S = 4;
const HENING_AJAKAN_S = 1;
const TANGGAPAN_MAKS_S = 5;
const BERUNTUN_MAKS_S = 1.5;
const SURUHAN_JEDA_MAKS_S = AMBANG_S;
const MOMEN_S = 5;

const AJAK_SURUH = new Set(["ayo", "coba", "hayo", "yuk"]);
const KATA_SURUH = new Set(["bilang", "ngomong", "sebut", "ucapkan", "ucap"]);

/** Waktu setiap kemunculan suruhan "ayo bilang" (atau "bilang dong") di ucapan perekam. */
function kemunculanSuruhan(ucapan: Ucapan[]): number[] {
  const waktu: number[] = [];
  for (const u of ucapan) {
    const k = u.kata.map((x) => x.teks.toLowerCase().replace(/[^\p{L}]/gu, ""));
    for (let i = 0; i < k.length - 1; i++) {
      const suruh = (AJAK_SURUH.has(k[i]) && KATA_SURUH.has(k[i + 1])) || (k[i] === "bilang" && (k[i + 1] === "dong" || k[i + 1] === "ayo"));
      if (suruh) {
        waktu.push(u.kata[i].t_mulai);
        i++;
      }
    }
  }
  return waktu;
}

export type Masukan = {
  ucapan: Ucapan[];
  peran: Peran;
  kata_target: string[];
  durasi_s: number;
  mulai_menunggu_s: number[];
  ukuran_nonaktif: string[];
};

export type HasilUkur = {
  ajakan: Ajakan[];
  ukuran: Omit<Ukuran, "perluasan_ai">;
  momen: Momen | null;
  /** Ucapan perekam yang menjadi bahan kalimat versi anak (memuat kata target, pendek). */
  kandidat_versi_anak: string[];
};

const bulat = (n: number) => Math.round(n * 10) / 10;

function memuatKataTarget(teks: string, kataTarget: string[]) {
  const kata: string[] = teks.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  return kataTarget.some((k) => kata.includes(k.toLowerCase()));
}

/** Waktu mulai suara berikutnya setelah t: perekam, dewasa lain, dan anak. `ucapanDewasa` tanpa ucapan anak. */
function suaraBerikut(t: number, ucapanDewasa: Ucapan[], perekam: string | null, anak: Rentang[]) {
  const setelah = ucapanDewasa.filter((u) => u.t_mulai >= t - 0.05);
  return {
    perekam: setelah.find((u) => u.pembicara === perekam)?.t_mulai ?? Infinity,
    dewasa: setelah.find((u) => u.pembicara !== perekam)?.t_mulai ?? Infinity,
    anak: anak.find((s) => s.t_mulai >= t - 0.05)?.t_mulai ?? Infinity,
  };
}

export function ukur(m: Masukan): HasilUkur {
  const { ucapan, peran } = m;
  const perekam = peran.perekam;
  const milikPerekam = ucapan.filter((u) => u.pembicara === perekam);
  const dewasaLain = new Set(peran.dewasa_lain);
  const suaraAnak = [...peran.suara_anak].sort((a, b) => a.t_mulai - b.t_mulai);
  // Ucapan dewasa lain saja yang dipakai sebagai pengakhir jeda (anak berlabel sudah di suaraAnak).
  const ucapanDewasa = ucapan.filter((u) => u.pembicara === perekam || dewasaLain.has(u.pembicara));

  const ajakan: Ajakan[] = [];
  let giliran = 0;
  let momen: Momen | null = null;

  for (let i = 0; i < milikPerekam.length; i++) {
    const u = milikPerekam[i];
    const tombol = m.mulai_menunggu_s.find((t) => t >= u.t_selesai - 1 && t <= u.t_selesai + 2);
    const berikut = suaraBerikut(u.t_selesai, ucapanDewasa, perekam, suaraAnak);
    const pertamaSesudah = Math.min(berikut.perekam, berikut.dewasa, berikut.anak, m.durasi_s);
    const hening = pertamaSesudah - u.t_selesai;

    const ditandai =
      u.teks.trimEnd().endsWith("?") || memuatKataTarget(u.teks, m.kata_target) || hening >= HENING_AJAKAN_S || tombol !== undefined;
    if (!ditandai) continue;

    const mulaiTunggu = tombol ?? u.t_selesai;
    const akhirTunggu = Math.min(berikut.perekam, berikut.dewasa, berikut.anak, m.durasi_s);
    const jeda = Math.max(0, akhirTunggu - mulaiTunggu);

    let kategori: Ajakan["kategori"];
    if (berikut.anak <= Math.min(berikut.perekam, berikut.dewasa) && berikut.anak < m.durasi_s) {
      kategori = "anak_merespons";
    } else if (jeda >= AMBANG_S) {
      kategori = "menunggu_cukup";
    } else if (berikut.dewasa < berikut.perekam) {
      continue; // disela dewasa lain sebelum ambang: tidak dinilai
    } else if (berikut.perekam === Infinity) {
      continue; // rekaman berakhir sebelum ambang
    } else {
      kategori = "memotong";
    }
    ajakan.push({ t_mulai: bulat(u.t_mulai), t_selesai: bulat(u.t_selesai), teks: u.teks, kategori, jeda_s: bulat(jeda) });

    if (kategori === "anak_merespons") {
      const anak = suaraAnak.find((s) => s.t_mulai >= u.t_selesai - 0.05)!;
      const tanggapan = milikPerekam.find((x) => x.t_mulai >= anak.t_selesai - 0.05);
      if (tanggapan && tanggapan.t_mulai - anak.t_selesai <= TANGGAPAN_MAKS_S) {
        giliran += 1;
        if (!momen && jeda >= AMBANG_S) {
          const mulai = Math.max(0, anak.t_mulai - 3);
          momen = { t_mulai: bulat(mulai), t_selesai: bulat(Math.min(m.durasi_s, mulai + MOMEN_S)) };
        }
      }
    }
  }

  // Bila tidak ada giliran setelah jeda panjang, momen = giliran pertama mana pun.
  if (!momen) {
    const pertama = ajakan.find((a) => a.kategori === "anak_merespons");
    if (pertama) {
      const anak = suaraAnak.find((s) => s.t_mulai >= pertama.t_selesai - 0.05)!;
      const mulai = Math.max(0, anak.t_mulai - 3);
      momen = { t_mulai: bulat(mulai), t_selesai: bulat(Math.min(m.durasi_s, mulai + MOMEN_S)) };
    }
  }

  const anakDiAntara = (a: number, b: number) => suaraAnak.some((s) => s.t_mulai >= a && s.t_mulai < b);
  const hitungBeruntun = (cocok: (u: Ucapan) => boolean, jedaMaks: number) => {
    let runtun = 0;
    let panjang = 0;
    let sebelum: Ucapan | null = null;
    for (const u of milikPerekam) {
      if (!cocok(u)) {
        if (panjang >= 2) runtun++;
        panjang = 0;
        sebelum = null;
        continue;
      }
      const lanjut = sebelum && u.t_mulai - sebelum.t_selesai <= jedaMaks && !anakDiAntara(sebelum.t_selesai, u.t_mulai);
      if (lanjut) panjang++;
      else {
        if (panjang >= 2) runtun++;
        panjang = 1;
      }
      sebelum = u;
    }
    if (panjang >= 2) runtun++;
    return runtun;
  };

  // Suruhan dihitung per kemunculan frasa, karena "ayo bilang" yang rapat tergabung dalam satu ucapan.
  // Runtun = ≥ 2 kemunculan dengan jarak ≤ ambang dan tanpa suara anak di antaranya.
  const suruhanBeruntun = () => {
    const w = kemunculanSuruhan(milikPerekam);
    let runtun = 0;
    let panjang = 1;
    for (let i = 1; i <= w.length; i++) {
      const lanjut = i < w.length && w[i] - w[i - 1] <= SURUHAN_JEDA_MAKS_S && !anakDiAntara(w[i - 1], w[i]);
      if (lanjut) panjang++;
      else {
        if (panjang >= 2) runtun++;
        panjang = 1;
      }
    }
    return runtun;
  };

  const berhasil = ajakan.filter((a) => a.kategori !== "memotong");
  const jedaRata = ajakan.length ? bulat(ajakan.reduce((n, a) => n + a.jeda_s, 0) / ajakan.length) : null;

  return {
    ajakan,
    ukuran: {
      jumlah_ajakan: ajakan.length,
      ajakan_berhasil: berhasil.length,
      memotong: ajakan.length - berhasil.length,
      jeda_rata_s: jedaRata,
      giliran,
      vokalisasi_anak: suaraAnak.length,
      ucapan_kata_target: milikPerekam.filter((u) => memuatKataTarget(u.teks, m.kata_target)).length,
      pertanyaan_beruntun: hitungBeruntun((u) => u.teks.trimEnd().endsWith("?"), BERUNTUN_MAKS_S),
      suruhan_beruntun: m.ukuran_nonaktif.includes("suruhan_beruntun") ? 0 : suruhanBeruntun(),
    },
    momen,
    kandidat_versi_anak: milikPerekam
      .filter((u) => memuatKataTarget(u.teks, m.kata_target) && u.kata.length <= 8)
      .map((u) => u.teks)
      .slice(0, 6),
  };
}
