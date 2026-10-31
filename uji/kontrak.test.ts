import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";
import { API, type Titik } from "../lib/kontrak/api";
import { CONTOH } from "../lib/kontrak/contoh";
import { periksaMatriks } from "../lib/kontrak/layar";

// Penjaga K1 dan K3. Naikkan TITIK_SEKARANG setiap kali satu titik integrasi ditutup:
// endpoint dengan titik ≤ TITIK_SEKARANG wajib punya route, sisanya dicatat sebagai todo.
const TITIK_SEKARANG: Titik = "I1";
const URUT: Titik[] = ["I0", "I1", "I2", "I3"];

const AKAR = join(import.meta.dirname, "..");

/** "/api/undangan/:kode" → "app/api/undangan/[kode]/route.ts" */
function berkasRoute(path: string) {
  return join(AKAR, "app", ...path.slice(1).split("/").map((s) => (s.startsWith(":") ? `[${s.slice(1)}]` : s)), "route.ts");
}

function ekspor(isi: string, metode: string) {
  return new RegExp(`export\\s+(const\\s+${metode}\\b|async\\s+function\\s+${metode}\\b|function\\s+${metode}\\b)`).test(isi);
}

for (const [nama, e] of Object.entries(API)) {
  const wajib = URUT.indexOf(e.titik) <= URUT.indexOf(TITIK_SEKARANG);
  const berkas = berkasRoute(e.path);
  const judul = `${e.metode} ${e.path} (${nama}, ${e.titik}) punya route`;
  if (!existsSync(berkas)) {
    if (wajib) test(judul, () => assert.fail(`belum ada ${relative(AKAR, berkas)}`));
    else test(judul, { todo: `menunggu ${e.titik}` }, () => {});
    continue;
  }
  test(judul, () => {
    const isi = readFileSync(berkas, "utf8");
    assert.ok(ekspor(isi, e.metode), `${relative(AKAR, berkas)} belum mengekspor ${e.metode}`);
  });
}

function semuaBerkas(dir: string, hasil: string[] = []): string[] {
  if (!existsSync(dir)) return hasil;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) semuaBerkas(p, hasil);
    else if (/\.(ts|tsx)$/.test(n)) hasil.push(p);
  }
  return hasil;
}

test("setiap route dibungkus denganAkses (K1)", () => {
  const tanpa = semuaBerkas(join(AKAR, "app", "api"))
    .filter((p) => p.endsWith(`${sep}route.ts`))
    .filter((p) => !readFileSync(p, "utf8").includes("denganAkses("))
    .map((p) => relative(AKAR, p));
  assert.deepEqual(tanpa, []);
});

test("setiap route di app/api tercantum di kontrak", () => {
  const dikenal = new Set(Object.values(API).map((e) => berkasRoute(e.path)));
  const asing = semuaBerkas(join(AKAR, "app", "api"))
    .filter((p) => p.endsWith(`${sep}route.ts`) && !dikenal.has(p))
    .map((p) => relative(AKAR, p));
  assert.deepEqual(asing, []);
});

test("layar tidak memanggil fetch('/api/…') di luar panggil() (K3)", () => {
  const izin = join(AKAR, "lib", "perangkat", "panggil.ts");
  const pelanggar = [join(AKAR, "app"), join(AKAR, "components"), join(AKAR, "lib", "perangkat")]
    .flatMap((d) => semuaBerkas(d))
    .filter((p) => p !== izin && !p.includes(`${sep}app${sep}api${sep}`))
    .filter((p) => /fetch\(\s*[`"']\/api\//.test(readFileSync(p, "utf8")))
    .map((p) => relative(AKAR, p));
  assert.deepEqual(pelanggar, []);
});

test("matriks layar → endpoint lengkap (I0)", () => {
  assert.deepEqual(periksaMatriks(), []);
});

for (const [nama, contoh] of Object.entries(CONTOH)) {
  test(`contoh ${nama} lolos skema response`, () => {
    const e = API[nama as keyof typeof API];
    assert.ok("response" in e && e.response, `${nama} tidak punya response`);
    const hasil = e.response.safeParse(contoh);
    assert.ok(hasil.success, hasil.success ? "" : JSON.stringify(hasil.error.issues.slice(0, 3)));
  });
}
