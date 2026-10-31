import assert from "node:assert/strict";
import { test } from "node:test";
import { FAKTA_KOSONG, tandaRegresi, tentukanStatus, type Fakta } from "../lib/status/aturan";
import { lebihTinggi } from "../lib/status/naikkan";

// A5.2: setiap pemicu Tabel 2 punya tes; 10 kasus regresi → 10/10 Bahas minggu ini.

const f = (ubah: Partial<Fakta>): Fakta => ({ ...FAKTA_KOSONG, ...ubah });

test("tanpa pemicu → Lanjut", () => {
  assert.deepEqual(tentukanStatus(FAKTA_KOSONG), { status: "lanjut", pemicu: null });
});

const BAHAS: [string, Partial<Fakta>][] = [
  ["regresi", { regresi: true }],
  ["tidak aktif dua sesi", { tidak_aktif_dua_sesi: true }],
];
for (const [nama, ubah] of BAHAS) {
  test(`Bahas minggu ini: ${nama}`, () => assert.equal(tentukanStatus(f(ubah)).status, "bahas_minggu_ini"));
}

const MENINJAU: [string, Partial<Fakta>][] = [
  ["perubahan baru", { perubahan_baru: "Pengasuh baru: Nenek" }],
  ["pendengaran belum diperiksa", { pendengaran_belum_diperiksa: true }],
  ["tidak aktif 4 hari", { hari_tidak_aktif: 4 }],
  ["kata tidak bertambah 3 minggu", { minggu_tanpa_kata_baru: 3 }],
  ["lebih sedikit bersuara 3 hari", { hari_berturut_lebih_sedikit_bersuara: 3 }],
  ["ditolak 3 kali berturut", { ditolak_berturut: 3 }],
  ["ditandai kurang tepat dalam 7 hari", { kurang_tepat_7_hari: true }],
  ["AI ragu", { ai_ragu: true }],
];
for (const [nama, ubah] of MENINJAU) {
  test(`Terapis meninjau: ${nama}`, () => assert.equal(tentukanStatus(f(ubah)).status, "terapis_meninjau"));
}

test("di bawah ambang tetap Lanjut", () => {
  assert.equal(tentukanStatus(f({ hari_tidak_aktif: 3, ditolak_berturut: 2, hari_berturut_lebih_sedikit_bersuara: 2, minggu_tanpa_kata_baru: 2 })).status, "lanjut");
});

test("regresi mengalahkan pemicu Terapis meninjau", () => {
  assert.equal(tentukanStatus(f({ regresi: true, ai_ragu: true, hari_tidak_aktif: 5 })).status, "bahas_minggu_ini");
});

test("status hanya bisa naik", () => {
  assert.ok(lebihTinggi("bahas_minggu_ini", "terapis_meninjau"));
  assert.ok(!lebihTinggi("lanjut", "terapis_meninjau"));
  assert.ok(!lebihTinggi("terapis_meninjau", "terapis_meninjau"));
});

// 10 kasus regresi dari catatan malam bebas (tanpa kotak regresi dicentang).
const KASUS_REGRESI = [
  "Dulu sudah bisa bilang papa, sekarang tidak lagi.",
  "dulu raka bisa bilang mamam, sekarang nggak mau ngomong sama sekali",
  "Kata 'bebek' hilang, padahal minggu lalu masih sering.",
  "Sekarang sudah tidak bilang 'mau' lagi.",
  "Dulu pernah manggil 'ibu', sekarang gak pernah lagi.",
  "Beberapa kata hilang sejak demam kemarin.",
  "Raka sudah nggak ngomong 'lagi' padahal dulu tiap mandi bilang.",
  "dulu bisa sebut 'cicak' sekarang lupa",
  "Ucapan 'buka' hilang dua hari ini.",
  "Dulu sudah bisa minta 'susu', kini enggak bisa lagi.",
];

test("10 kasus regresi dari catatan → 10/10 Bahas minggu ini", () => {
  const hasil = KASUS_REGRESI.map((c) => tentukanStatus(f({ regresi: tandaRegresi(c) })).status);
  const kena = hasil.filter((s) => s === "bahas_minggu_ini").length;
  assert.equal(kena, 10, KASUS_REGRESI.filter((_, i) => hasil[i] !== "bahas_minggu_ini").join(" | "));
});

test("catatan biasa tidak dianggap regresi", () => {
  for (const c of ["Hari ini Raka bilang bek dua kali waktu mandi.", "Agak rewel karena tumbuh gigi.", "Sekarang sudah bisa bilang lagi!"]) {
    assert.equal(tandaRegresi(c), false, c);
  }
});
