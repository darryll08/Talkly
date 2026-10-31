import assert from "node:assert/strict";
import { test } from "node:test";
import { bendaAturan, ekstrakAturan, ekstrakUcapanAnak, kartuBenda } from "../lib/ai/ekstrak";

// K12 / A4.3: ekstraksi ucapan anak dari catatan malam, dan kartu benda dari nama saja.

const LIMA_CATATAN: [string, string[]][] = [
  ["Waktu mandi Raka bilang bek sambil menunjuk bebek.", ["bek"]],
  ["Sebelum makan dia bilang 'mamam' dua kali.", ["mamam"]],
  ["Lihat kucing, Raka nyebut \"cing\" lalu tertawa.", ["cing"]],
  ["Hari ini rewel, tidak banyak bersuara.", []],
  ["Main mobil, Raka bilang jan, terus sebut \"bis\".", ["jan", "bis"]],
];

test("cadangan aturan mengekstrak kata dari 5 catatan contoh", () => {
  for (const [catatan, harap] of LIMA_CATATAN) assert.deepEqual(ekstrakAturan(catatan).sort(), [...harap].sort(), catatan);
});

test("keluaran AI yang tidak ada di catatan dibuang", async () => {
  const kata = await ekstrakUcapanAnak("Raka bilang bek waktu mandi.", "Raka", async () => ({ kata: ["bek", "bebek mandi pagi", "papa"] }));
  assert.deepEqual(kata, ["bek"]);
});

test("AI gagal → cadangan aturan", async () => {
  const kata = await ekstrakUcapanAnak("Sebelum makan dia bilang 'mamam'.", "Raka", async () => {
    throw new Error("timeout");
  });
  assert.deepEqual(kata, ["mamam"]);
});

test("nama anak disamarkan sebelum ekstraksi dikirim", async () => {
  let terkirim = "";
  await ekstrakUcapanAnak("Raka bilang bek.", "Raka", async (input) => {
    terkirim = input;
    return { kata: ["bek"] };
  });
  assert.doesNotMatch(terkirim, /Raka/);
});

test("kartu benda: keluaran AI sah dipakai, kalimat tahap 1 tanpa tanda tanya", async () => {
  const anak = { nama: "Raka", tahap: 1, kata_target: ["bebek", "mamam", "lagi", "mau", "buka"] };
  const ok = await kartuBenda("bebek karet kuning", anak, async () => ({ kata: "bebek", contoh_kalimat: ["Bebek!", "Bebek… mandi!", "Bebek mana?"] }));
  assert.equal(ok.kata, "bebek");
  assert.deepEqual(ok.contoh_kalimat, ["Bebek!", "Bebek… mandi!"]);
});

test("kartu benda: keluaran AI buruk → cadangan aturan memakai kata target", async () => {
  const anak = { nama: "Raka", tahap: 1, kata_target: ["bebek", "mamam", "lagi", "mau", "buka"] };
  const h = await kartuBenda("bebek karet", anak, async () => ({ kata: "bebek", contoh_kalimat: ["Ayo bilang bebek sekarang juga ya nak"] }));
  assert.deepEqual(h, bendaAturan("bebek karet", 1, anak.kata_target));
  assert.equal(h.kata, "bebek");
  assert.ok(h.contoh_kalimat.length >= 2 && h.contoh_kalimat.every((c) => !c.includes("?")));
});
