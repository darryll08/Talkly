// A7.3: 50 draf rencana acak dari GPT-6 Luna harus bebas kata terlarang dan hanya memakai aktivitas dari bank.
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs uji/rencana-acak.ts [jumlah]
// Hasil ditulis ke data/uji/hasil-rencana.json dan dibaca uji/akurasi.ts.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { susunDraf, type MasukanDraf } from "../lib/ai/rencana";
import { kataTerlarangDi } from "../lib/kontrak/konten";
import { BANK, ID_BANK } from "../lib/terapis/program";

const JUMLAH = Number(process.argv[2] ?? 50);
const PARALEL = 5;

const NAMA = ["Raka", "Alya", "Bima", "Citra", "Dafa", "Elsa", "Fajar", "Gita"];
const KATA = ["bebek", "mamam", "lagi", "mau", "buka", "bola", "susu", "mobil", "jalan", "tutup", "minum", "kucing"];
const CATATAN = [
  "Anak mulai bersuara saat ditunggu. Lanjut strategi menunggu, tambah perluasan satu kata.",
  "Minggu ini banyak sakit, latihan sedikit. Ulangi aktivitas yang sama, jangan menambah target.",
  "Ibu masih sering bilang 'ayo bilang'. Fokus mengganti suruhan dengan menyebut kata lalu menunggu.",
  "Pengasuh lebih sering di rumah. Beri aktivitas bermain untuk pengasuh, aktivitas makan untuk ibu.",
  "Anak sudah konsisten bilang dua kata. Coba naikkan ke kalimat dua kata saat makan.",
  "Keluarga tidak aktif empat hari karena pindahan. Mulai lagi dengan satu aktivitas pendek per hari.",
];
const acak = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function profil(i: number): MasukanDraf {
  const tahap = 1 + (i % 4);
  const kata = [...KATA].sort(() => Math.random() - 0.5).slice(0, 5);
  const anggota = [
    { id: crypto.randomUUID(), nama: "Ibu Uji", peran: "ibu" },
    ...(i % 2 ? [{ id: crypto.randomUUID(), nama: "Mbak Uji", peran: "pengasuh" }] : []),
    ...(i % 5 === 0 ? [{ id: crypto.randomUUID(), nama: "Nenek Uji", peran: "nenek" }] : []),
  ];
  const berjalan = BANK.filter((a) => a.tahap === tahap).slice(0, 2).map((a, n) => ({ aktivitas_id: a.id, anggota_id: null, urutan: n + 1 }));
  return {
    anak: { nama: acak(NAMA), tahap, kata_target: kata, strategi_fokus: acak(["Menunggu", "Mencontohkan", "Memperluas"]), minat: acak(["bebek", "mobil", "lagu", "bola"]), rutinitas: "Mandi sore, makan bersama" },
    anggota,
    catatan_sesi: acak(CATATAN),
    ringkasan_7_hari: `${1 + (i % 4)} rekaman dinilai, jeda rata-rata ${(2 + (i % 3) * 0.7).toFixed(1)} detik.`,
    rencana_berjalan: berjalan,
  };
}

async function utama() {
  const hasil: { sumber: string; terlarang: string[]; di_luar_bank: string[]; catatan: string[] }[] = [];
  for (let i = 0; i < JUMLAH; i += PARALEL) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(PARALEL, JUMLAH - i) }, async (_, k) => {
        const d = await susunDraf(profil(i + k));
        const teks = [d.isi.pesan_keluarga, ...d.dasar.map((x) => x.alasan)].join(" ");
        return { sumber: d.sumber, terlarang: kataTerlarangDi(teks), di_luar_bank: d.isi.item.filter((x) => !ID_BANK.has(x.aktivitas_id)).map((x) => x.aktivitas_id), catatan: d.catatan };
      }),
    );
    hasil.push(...batch);
    process.stdout.write(`${hasil.length}/${JUMLAH} `);
  }
  const ringkas = {
    dijalankan: new Date().toISOString(),
    jumlah: hasil.length,
    bebas_terlarang: hasil.filter((h) => h.terlarang.length === 0).length,
    di_bank: hasil.filter((h) => h.di_luar_bank.length === 0).length,
    cadangan: hasil.filter((h) => h.sumber === "cadangan").length,
    alasan_cadangan: [...new Set(hasil.flatMap((h) => h.catatan))].slice(0, 10),
  };
  mkdirSync(join(import.meta.dirname, "..", "data", "uji"), { recursive: true });
  writeFileSync(join(import.meta.dirname, "..", "data", "uji", "hasil-rencana.json"), JSON.stringify(ringkas, null, 2) + "\n");
  console.log(`\n${JSON.stringify(ringkas, null, 2)}`);
}

utama();
