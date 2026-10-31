// Tes B1.3: nada sintetis 150, 300, 450 Hz terbaca dalam ±5% tanpa salah oktaf,
// dan rangkuman kandidat suara anak.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { kandidatSuaraAnak, type Frame } from "./jejak";

type Fungsi = { hitungF0: (x: Float32Array, sr: number) => number; hitungDbfs: (x: Float32Array) => number };

const konteks: { globalThis?: unknown; __jejakNada?: Fungsi } = {};
konteks.globalThis = konteks;
runInNewContext(readFileSync(new URL("../../public/worklet/jejak-nada.js", import.meta.url), "utf8"), konteks);
const { hitungF0, hitungDbfs } = konteks.__jejakNada!;

const SR = 48000;

function nada(f: number, detik = 0.04, harmonik = true) {
  const x = new Float32Array(Math.round(SR * detik));
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    // Suara manusia kaya harmonik; harmonik kedua yang kuat adalah penyebab umum salah oktaf.
    x[i] = 0.3 * Math.sin(2 * Math.PI * f * t) + (harmonik ? 0.25 * Math.sin(2 * Math.PI * 2 * f * t) + 0.1 * Math.sin(2 * Math.PI * 3 * f * t) : 0);
  }
  return x;
}

for (const f of [150, 300, 450]) {
  test(`nada ${f} Hz terbaca dalam ±5%`, () => {
    for (const harmonik of [false, true]) {
      const f0 = hitungF0(nada(f, 0.04, harmonik), SR);
      assert.ok(Math.abs(f0 - f) / f <= 0.05, `${f} Hz (harmonik=${harmonik}) terbaca ${f0.toFixed(1)} Hz`);
    }
  });
}

test("hening tidak punya f0", () => {
  assert.equal(hitungF0(new Float32Array(SR * 0.04), SR), 0);
  assert.ok(hitungDbfs(new Float32Array(100)) <= -100);
});

test("derau acak tidak punya f0", () => {
  let s = 1;
  const x = new Float32Array(SR * 0.04).map(() => {
    s = (s * 16807) % 2147483647;
    return (s / 2147483647 - 0.5) * 0.4;
  });
  assert.equal(hitungF0(x, SR), 0);
});

test("rentang f0 ≥ 280 Hz selama ≥ 0,2 detik menjadi kandidat suara anak", () => {
  const frames: Frame[] = [];
  for (let i = 1; i <= 60; i++) {
    const t = Math.round(i * 5) / 100;
    let f0 = 0;
    if (t >= 0.5 && t <= 0.9) f0 = 350; // 0,45 detik bernada tinggi → kandidat
    if (t >= 1.5 && t <= 1.6) f0 = 400; // terlalu pendek → bukan kandidat
    if (t >= 2.0 && t <= 2.6) f0 = 180; // suara dewasa → bukan kandidat
    frames.push([t, f0 ? -25 : -60, f0]);
  }
  const k = kandidatSuaraAnak(frames);
  assert.equal(k.length, 1);
  assert.equal(k[0].f0_rata, 350);
  assert.ok(k[0].t_mulai <= 0.5 && k[0].t_selesai >= 0.9);
});
