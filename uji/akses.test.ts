import assert from "node:assert/strict";
import { test } from "node:test";
import { API } from "../lib/kontrak/api";

// Penjaga K1/K2 terhadap server yang berjalan: UJI_URL=http://localhost:3000 npm run uji
// Tanpa UJI_URL, tes dilewati. Uji lintas keluarga (404) dan terapis lain (403) menyusul setelah seed punya Keluarga Uji B.

const URL_UJI = process.env.UJI_URL?.replace(/\/$/, "");
const ID_PALSU = "00000000-0000-4000-8000-000000000000";

function isiPath(path: string) {
  return path.replace(/:[a-zA-Z]+/g, ID_PALSU);
}

for (const [nama, e] of Object.entries(API)) {
  if ((e.akses as readonly string[]).includes("publik")) continue;
  test(`${e.metode} ${e.path} tanpa cookie → 401 (${nama})`, { skip: !URL_UJI && "UJI_URL belum diisi" }, async () => {
    const res = await fetch(`${URL_UJI}${isiPath(e.path)}`, {
      method: e.metode,
      headers: e.metode === "GET" || e.metode === "DELETE" ? {} : { "Content-Type": "application/json" },
      body: e.metode === "GET" || e.metode === "DELETE" ? undefined : "{}",
      redirect: "manual",
    });
    // 404 berarti route belum dibuat; kontrak.test.ts yang menagihnya sesuai titik.
    if (res.status === 404) return;
    assert.equal(res.status, 401);
  });
}
