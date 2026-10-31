import assert from "node:assert/strict";
import { test } from "node:test";
import aktivitas from "../data/aktivitas.json";
import templat from "../data/templat.json";
import { BankAktivitas, DaftarTemplat, kataTerlarangDi, PemicuPujian, PemicuSaran } from "../lib/kontrak/konten";

// A2.1: bank aktivitas dan templat lolos skema, bebas kata terlarang, setiap templat punya pemicu.

test("bank aktivitas lolos skema dan ID unik", () => {
  const bank = BankAktivitas.parse(aktivitas);
  assert.equal(new Set(bank.map((a) => a.id)).size, bank.length);
});

test("bank aktivitas mencakup tahap 1–4 dan rutinitas utama", () => {
  const bank = BankAktivitas.parse(aktivitas);
  for (const t of [1, 2, 3, 4]) assert.ok(bank.some((a) => a.tahap === t), `tahap ${t}`);
  for (const r of ["mandi", "makan", "bermain", "berpakaian", "berbelanja"]) assert.ok(bank.some((a) => a.rutinitas === r), r);
});

test("templat: 18 buah, 9 pujian dan 9 saran, ID unik", () => {
  const daftar = DaftarTemplat.parse(templat);
  assert.equal(new Set(daftar.map((t) => t.id)).size, 18);
  assert.equal(daftar.filter((t) => t.jenis === "pujian").length, 9);
});

test("setiap pemicu punya templat, termasuk cadangan umum", () => {
  const daftar = DaftarTemplat.parse(templat);
  for (const p of PemicuPujian.options) assert.ok(daftar.some((t) => t.jenis === "pujian" && t.pemicu === p), p);
  for (const p of PemicuSaran.options) assert.ok(daftar.some((t) => t.jenis === "saran" && t.pemicu === p), p);
});

test("tidak ada kata terlarang di aktivitas dan templat", () => {
  const semua = [...JSON.stringify(aktivitas).split('","'), ...templat.map((t) => t.teks)];
  const temuan = semua.flatMap((s) => kataTerlarangDi(s).map((k) => `${k} di: ${s.slice(0, 60)}`));
  assert.deepEqual(temuan, []);
});
