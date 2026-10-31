import assert from "node:assert/strict";
import { test } from "node:test";
import { tandatangani, verifikasi } from "../lib/server/tanda";

// Rahasia dibaca saat fungsi dipanggil, jadi cukup diisi sebelum tes berjalan.
process.env.SESI_RAHASIA ??= "rahasia-uji-yang-cukup-panjang";

const ID = "3b0f6f8e-6c2a-4a8a-9d55-1f2a3b4c5d6e";

test("cookie yang ditandatangani terbaca kembali", () => {
  assert.equal(verifikasi(tandatangani(ID)), ID);
});

test("cookie yang diubah satu karakter ditolak", () => {
  const asli = tandatangani(ID);
  for (const i of [0, ID.length - 1, ID.length + 1, asli.length - 1]) {
    const c = asli[i] === "a" ? "b" : "a";
    const ubah = asli.slice(0, i) + c + asli.slice(i + 1);
    assert.equal(verifikasi(ubah), null, `posisi ${i}`);
  }
});

test("cookie kosong atau tanpa tanda ditolak", () => {
  assert.equal(verifikasi(undefined), null);
  assert.equal(verifikasi(""), null);
  assert.equal(verifikasi(ID), null);
  assert.equal(verifikasi(`${ID}.`), null);
});
