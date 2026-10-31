// Tulis docs/naskah-rekaman.md dan data/uji/kunci/Nxx.json dari uji/naskah.ts.
// Jeda manual yang sudah diisi di berkas kunci lama dipertahankan.
//   npx tsx uji/cetak-naskah.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hitungKunci, NASKAH, naskahMarkdown, type Kunci } from "./naskah";

const AKAR = join(import.meta.dirname, "..");
const dirKunci = join(AKAR, "data", "uji", "kunci");
mkdirSync(dirKunci, { recursive: true });

writeFileSync(join(AKAR, "docs", "naskah-rekaman.md"), naskahMarkdown());
for (const n of NASKAH) {
  const k = hitungKunci(n);
  const berkas = join(dirKunci, `${n.id}.json`);
  if (existsSync(berkas)) {
    const lama = JSON.parse(readFileSync(berkas, "utf8")) as Kunci;
    if (lama.jeda_manual_s?.length === k.ajakan.length) k.jeda_manual_s = lama.jeda_manual_s;
  }
  writeFileSync(berkas, JSON.stringify(k, null, 2) + "\n");
  console.log(`${n.id} ${String(k.durasi_s).padStart(5)} s  ajakan ${k.ajakan.length}  giliran ${k.giliran}  perluasan ${k.perluasan}  suruhan ${k.suruhan_beruntun}  ${k.ajakan.map((a) => ({ anak_merespons: "a", menunggu_cukup: "t", memotong: "p" })[a.kategori]).join("")}${k.harap_ditolak ? `  (ditolak: ${k.harap_ditolak})` : ""}`);
}
