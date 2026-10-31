// Nilai ulang bagian AI (perluasan, umpan balik) dari transkrip uji yang tersimpan, tanpa STT lagi.
// Dipakai bila prompt AI diperbaiki setelah rekaman dibuat. Transkrip dan ukuran kode tidak berubah.
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs uji/nilai-ulang.ts [N01 N02 ...]
// Hasil lama disimpan di hasil.nilai_awal, hasil baru menimpa hasil.ukuran.perluasan_ai dan hasil.umpan_balik.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nilaiRekaman } from "../lib/ai/nilai";
import { tentukanPeran } from "../lib/ukur/pembicara";
import { keUcapan } from "../lib/ukur/stt";
import { ukur } from "../lib/ukur/ukur";
import { KATA_TARGET, NASKAH } from "./naskah";

const AKAR = join(import.meta.dirname, "..");

async function utama() {
  const pilihan = process.argv.slice(2).map((x) => x.toUpperCase());
  for (const n of NASKAH) {
    if (pilihan.length && !pilihan.includes(n.id)) continue;
    const berkas = join(AKAR, "data", "uji", "transkrip", `${n.id}.json`);
    if (!existsSync(berkas)) continue;
    const s = JSON.parse(readFileSync(berkas, "utf8"));
    if (!s.meta?.transkrip || !s.hasil) continue;

    const ucapan = keUcapan(s.meta.transkrip);
    const peran = tentukanPeran(ucapan, s.meta.kandidat_suara_anak ?? []);
    const hasilUkur = ukur({ ucapan, peran, kata_target: KATA_TARGET, durasi_s: s.durasi_s, mulai_menunggu_s: s.meta.mulai_menunggu_s ?? [], ukuran_nonaktif: [] });
    const perekam = s.perekam ?? "Ibu Sari";
    const nilai = await nilaiRekaman({
      ucapan,
      perekam: peran.perekam,
      suara_anak: peran.suara_anak,
      ukur: hasilUkur,
      anak: { nama: "Raka", tahap: 1, kata_target: KATA_TARGET },
      nama_anggota: [{ nama: perekam, peran: perekam === "Mbak Sri" ? "pengasuh" : "ibu" }],
      sapaan: perekam === "Mbak Sri" ? "Mbak Sri" : "Ibu",
    });

    s.hasil.nilai_awal ??= { perluasan_ai: s.hasil.ukuran.perluasan_ai, umpan_balik: s.hasil.umpan_balik };
    s.hasil.ukuran.perluasan_ai = nilai.perluasan_ai;
    s.hasil.umpan_balik = nilai.umpan_balik;
    writeFileSync(berkas, JSON.stringify(s, null, 2) + "\n");
    console.log(`${n.id} perluasan ${s.hasil.nilai_awal.perluasan_ai} → ${nilai.perluasan_ai}  sumber ${nilai.umpan_balik.sumber}${nilai.catatan.length ? `  (${nilai.catatan.join("; ")})` : ""}`);
  }
}

utama().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
