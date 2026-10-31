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

test("kartu benda: nama tetap seperti yang diketik (maks 2 kata), kalimat AI sah dipakai, tahap 1 tanpa tanda tanya", async () => {
  const anak = { nama: "Raka", tahap: 1, kata_target: ["bebek", "mamam", "lagi", "mau", "buka"] };
  const ok = await kartuBenda("bebek karet kuning", anak, async () => ({
    kata: "bebek",
    contoh_kalimat: ["Bebek karet!", "Bebek karet… mandi!", "Bebek karet mana?"],
  }));
  assert.equal(ok.kata, "bebek karet");
  assert.deepEqual(ok.contoh_kalimat, ["Bebek karet!", "Bebek karet… mandi!"]);
  const satu = await kartuBenda("bola", anak, async () => ({ kata: "bola", contoh_kalimat: ["Bola!", "Mau bola"] }));
  assert.equal(satu.kata, "bola");
});

test("kartu benda: AI memendekkan nama atau keluarannya buruk → cadangan aturan dengan nama utuh", async () => {
  const anak = { nama: "Raka", tahap: 1, kata_target: ["bebek", "mamam", "lagi", "mau", "buka"] };
  const h = await kartuBenda("botol biru", anak, async () => ({ kata: "botol", contoh_kalimat: ["Botol!", "Mau botol"] }));
  assert.deepEqual(h, bendaAturan("botol biru", 1));
  assert.equal(h.kata, "botol biru");
  assert.ok(h.contoh_kalimat.length >= 2 && h.contoh_kalimat.every((c) => !c.includes("?")));
});
