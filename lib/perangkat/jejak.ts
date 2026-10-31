// Merangkum frame jejak nada [detik, dBFS, f0] dari AudioWorklet menjadi kandidat suara anak.
// Kandidat = rentang bersuara dengan f0 ≥ 280 Hz yang berlangsung ≥ 0,2 detik.

export type Frame = [detik: number, dbfs: number, f0: number];
export type Kandidat = { t_mulai: number; t_selesai: number; f0_rata: number };

export const HOP_S = 0.05;
export const F0_ANAK = 280;
export const DURASI_MIN_S = 0.2;
/** Celah satu frame yang tidak bersuara di tengah ucapan masih dianggap satu rentang. */
const CELAH_MAKS = 1;

export function kandidatSuaraAnak(frames: readonly Frame[]): Kandidat[] {
  const hasil: Kandidat[] = [];
  let mulai: number | null = null;
  let akhir = 0;
  let jumlahF0 = 0;
  let n = 0;
  let celah = 0;

  const tutup = () => {
    if (mulai !== null && akhir - mulai + HOP_S >= DURASI_MIN_S - 1e-9) {
      hasil.push({
        t_mulai: bulat(mulai - HOP_S),
        t_selesai: bulat(akhir),
        f0_rata: Math.round(jumlahF0 / n),
      });
    }
    mulai = null;
    jumlahF0 = 0;
    n = 0;
    celah = 0;
  };

  for (const [detik, , f0] of frames) {
    if (f0 >= F0_ANAK) {
      if (mulai === null) mulai = detik;
      akhir = detik;
      jumlahF0 += f0;
      n++;
      celah = 0;
    } else if (mulai !== null) {
      celah++;
      if (celah > CELAH_MAKS) tutup();
    }
  }
  tutup();
  return hasil;
}

function bulat(x: number) {
  return Math.round(x * 100) / 100;
}

/** Jejak disimpan ringkas untuk dikirim di meta rekaman. */
export function ringkasJejak(frames: readonly Frame[]): Frame[] {
  return frames.map(([t, db, f0]) => [bulat(t), Math.round(db * 10) / 10, Math.round(f0)]);
}
