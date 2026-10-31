// AudioWorklet jejak nada. Per 50 ms (HOP_S) mengirim frame [detik, dBFS, f0] ke halaman.
// f0 dihitung dengan autokorelasi ternormalisasi (rentang 120–520 Hz) plus pemeriksaan salah oktaf.
// Fungsi hitungF0 dan hitungDbfs juga diuji langsung di lib/perangkat/jejak.test.ts.

const HOP_S = 0.05;
const JENDELA_S = 0.04;
const F0_MIN = 120;
const F0_MAKS = 520;
const AMBANG_DBFS = -50;
const AMBANG_KORELASI = 0.5;

function hitungDbfs(sampel) {
  let jumlah = 0;
  for (let i = 0; i < sampel.length; i++) jumlah += sampel[i] * sampel[i];
  const rms = Math.sqrt(jumlah / sampel.length);
  return rms > 0 ? 20 * Math.log10(rms) : -120;
}

function korelasi(x, lag) {
  let atas = 0;
  let e1 = 0;
  let e2 = 0;
  const n = x.length - lag;
  for (let i = 0; i < n; i++) {
    atas += x[i] * x[i + lag];
    e1 += x[i] * x[i];
    e2 += x[i + lag] * x[i + lag];
  }
  return e1 > 0 && e2 > 0 ? atas / Math.sqrt(e1 * e2) : 0;
}

/** f0 dalam Hz, atau 0 bila tidak bersuara. */
function hitungF0(sampel, sampleRate) {
  const lagMin = Math.floor(sampleRate / F0_MAKS);
  const lagMaks = Math.min(Math.ceil(sampleRate / F0_MIN), sampel.length - 2);
  if (lagMaks <= lagMin) return 0;

  // Buang komponen DC.
  let rata = 0;
  for (let i = 0; i < sampel.length; i++) rata += sampel[i];
  rata /= sampel.length;
  const x = new Float32Array(sampel.length);
  for (let i = 0; i < sampel.length; i++) x[i] = sampel[i] - rata;

  const r = new Float32Array(lagMaks + 2);
  let terbaik = 0;
  let lagTerbaik = 0;
  for (let lag = lagMin; lag <= lagMaks + 1; lag++) {
    r[lag] = korelasi(x, lag);
    if (lag <= lagMaks && r[lag] > terbaik) {
      terbaik = r[lag];
      lagTerbaik = lag;
    }
  }
  if (terbaik < AMBANG_KORELASI || lagTerbaik === 0) return 0;

  // Pemeriksaan salah oktaf: puncak di lag yang lebih kecil (oktaf lebih tinggi)
  // yang hampir sama kuat lebih dipercaya, karena kelipatan periode selalu ikut berkorelasi tinggi.
  for (let pembagi = 4; pembagi >= 2; pembagi--) {
    const kandidat = Math.round(lagTerbaik / pembagi);
    if (kandidat < lagMin) continue;
    let lagLokal = kandidat;
    for (let d = -2; d <= 2; d++) {
      const l = kandidat + d;
      if (l >= lagMin && l <= lagMaks && r[l] > r[lagLokal]) lagLokal = l;
    }
    if (r[lagLokal] >= 0.9 * terbaik) {
      lagTerbaik = lagLokal;
      break;
    }
  }

  // Interpolasi parabola di sekitar puncak agar lebih presisi.
  const a = r[lagTerbaik - 1] ?? 0;
  const b = r[lagTerbaik];
  const c = r[lagTerbaik + 1] ?? 0;
  const penyebut = a - 2 * b + c;
  const geser = penyebut !== 0 ? (0.5 * (a - c)) / penyebut : 0;
  const lagHalus = lagTerbaik + Math.max(-0.5, Math.min(0.5, geser));
  const f0 = sampleRate / lagHalus;
  return f0 >= F0_MIN * 0.95 && f0 <= F0_MAKS * 1.05 ? f0 : 0;
}

if (typeof AudioWorkletProcessor !== "undefined") {
  class JejakNada extends AudioWorkletProcessor {
    constructor() {
      super();
      this.panjangJendela = Math.round(sampleRate * JENDELA_S);
      this.panjangHop = Math.round(sampleRate * HOP_S);
      this.penyangga = new Float32Array(this.panjangJendela);
      this.isi = 0;
      this.sejakHop = 0;
      this.total = 0;
    }

    process(inputs) {
      const kanal = inputs[0] && inputs[0][0];
      if (!kanal) return true;
      for (let i = 0; i < kanal.length; i++) {
        // Penyangga geser berisi JENDELA_S detik terakhir.
        if (this.isi < this.panjangJendela) {
          this.penyangga[this.isi++] = kanal[i];
        } else {
          this.penyangga.copyWithin(0, 1);
          this.penyangga[this.panjangJendela - 1] = kanal[i];
        }
        this.total++;
        this.sejakHop++;
        if (this.sejakHop >= this.panjangHop && this.isi >= this.panjangJendela) {
          this.sejakHop = 0;
          const db = hitungDbfs(this.penyangga);
          const f0 = db > AMBANG_DBFS ? hitungF0(this.penyangga, sampleRate) : 0;
          const detik = Math.round((this.total / sampleRate) * 100) / 100;
          this.port.postMessage([detik, Math.round(db * 10) / 10, Math.round(f0)]);
        }
      }
      return true;
    }
  }
  registerProcessor("jejak-nada", JejakNada);
}

if (typeof globalThis !== "undefined") {
  globalThis.__jejakNada = { hitungF0, hitungDbfs, HOP_S };
}
