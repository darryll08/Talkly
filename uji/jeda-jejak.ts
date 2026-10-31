// Jeda pembanding dari jejak level ponsel (meta.jejak: [detik, dBFS, f0] tiap 50 ms), independen dari stempel waktu STT.
//   npx tsx uji/jeda-jejak.ts N01 N02 ...           (cetak saja)
//   npx tsx uji/jeda-jejak.ts N01 N02 ... --tulis   (isi jeda_manual_s yang masih kosong di data/uji/kunci/Nxx.json)
//
// Untuk setiap ajakan kunci yang cocok dengan ajakan sistem (aturan cocok sama dengan uji/akurasi.ts):
//   akhir bicara = frame terakhir di atas ambang dekat akhir ajakan menurut STT (±0,6 detik),
//   awal suara berikutnya = frame pertama sesudahnya yang di atas ambang dua frame berturut-turut.
//   Ambang = derau ruangan (persentil 10 level) + 8 dB. Resolusi 0,05 detik.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tentukanPeran } from "../lib/ukur/pembicara";
import { keUcapan } from "../lib/ukur/stt";
import { ukur } from "../lib/ukur/ukur";
import { KATA_TARGET, type Kunci } from "./naskah";

const AKAR = join(import.meta.dirname, "..");
const TULIS = process.argv.includes("--tulis");
const normal = (s: string) => s.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
function mirip(kunci: string, sistem: string) {
  const k = normal(kunci).split(" ").filter(Boolean);
  const s = new Set(normal(sistem).split(" "));
  return k.length > 0 && k.filter((w) => s.has(w)).length / k.length >= 0.5;
}

type Frame = [number, number, number];

const HENING_MIN = 5; // 0,25 detik di bawah ambang = bicara berhenti
const SUARA_MIN = 3; // 0,15 detik di atas ambang = suara berikutnya (bunyi sesaat diabaikan)

function jedaDariJejak(jejak: Frame[], tSelesai: number, ambang: number): number | null {
  const atas = (i: number) => i >= 0 && i < jejak.length && jejak[i][1] >= ambang;
  const runtun = (i: number, n: number, nilai: boolean) => Array.from({ length: n }, (_, k) => atas(i + k) === nilai).every(Boolean);
  // Akhir bicara: awal hening ≥ 0,25 detik pertama yang dimulai dalam ±0,6 detik dari akhir ajakan menurut STT.
  const mulai = jejak.findIndex((f) => f[0] >= tSelesai - 0.6);
  if (mulai < 0) return null;
  let hening = -1;
  for (let i = Math.max(1, mulai); i < jejak.length && jejak[i][0] <= tSelesai + 0.6; i++) {
    if (atas(i - 1) && runtun(i, HENING_MIN, false)) {
      hening = i;
      break;
    }
  }
  if (hening < 0) return null;
  for (let i = hening + HENING_MIN; i < jejak.length; i++) {
    if (runtun(i, SUARA_MIN, true)) return Math.round((jejak[i][0] - jejak[hening - 1][0]) * 100) / 100;
  }
  return null;
}

for (const id of process.argv.slice(2).filter((a) => /^N\d\d$/i.test(a)).map((a) => a.toUpperCase())) {
  const pKunci = join(AKAR, "data", "uji", "kunci", `${id}.json`);
  const pTranskrip = join(AKAR, "data", "uji", "transkrip", `${id}.json`);
  if (!existsSync(pKunci) || !existsSync(pTranskrip)) continue;
  const kunci = JSON.parse(readFileSync(pKunci, "utf8")) as Kunci;
  const s = JSON.parse(readFileSync(pTranskrip, "utf8"));
  const jejak: Frame[] = s.meta.jejak ?? [];
  if (jejak.length === 0) {
    console.log(`${id}: tidak ada jejak ponsel`);
    continue;
  }
  const level = jejak.map((f) => f[1]).sort((a, b) => a - b);
  const ambang = level[Math.floor(level.length * 0.1)] + 8;

  const ucapan = keUcapan(s.meta.transkrip);
  const peran = tentukanPeran(ucapan, s.meta.kandidat_suara_anak ?? []);
  const hasil = ukur({ ucapan, peran, kata_target: KATA_TARGET, durasi_s: s.durasi_s, mulai_menunggu_s: s.meta.mulai_menunggu_s ?? [], ukuran_nonaktif: [] });

  let j = 0;
  const jeda = kunci.ajakan.map((a) => {
    for (let x = j; x < hasil.ajakan.length; x++) {
      if (mirip(a.teks, hasil.ajakan[x].teks)) {
        j = x + 1;
        return { teks: a.teks, sistem: hasil.ajakan[x].jeda_s, jejak: jedaDariJejak(jejak, hasil.ajakan[x].t_selesai, ambang) };
      }
    }
    return { teks: a.teks, sistem: null, jejak: null };
  });

  console.log(`\n${id}  ambang ${ambang.toFixed(1)} dBFS`);
  for (const x of jeda) console.log(`  sistem ${String(x.sistem ?? "-").padStart(5)}  jejak ${String(x.jejak ?? "-").padStart(5)}  ${x.teks}`);
  if (TULIS) {
    kunci.jeda_manual_s = kunci.jeda_manual_s.map((lama, i) => lama ?? jeda[i].jejak);
    writeFileSync(pKunci, JSON.stringify(kunci, null, 2) + "\n");
  }
}
