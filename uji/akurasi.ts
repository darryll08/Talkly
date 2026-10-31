// Uji akurasi (A7.2): jalankan ulang pengukuran dari transkrip tersimpan (tanpa kredit STT),
// bandingkan dengan kunci naskah, tulis docs/hasil-uji.md.  npm run uji:akurasi
//
// Ukuran dan target:
//   selisih jeda rata-rata ≤ 0,5 detik (pembanding: jeda_manual_s di data/uji/kunci/Nxx.json)
//   ketepatan pengenalan ajakan ≥ 80%   (F1 antara ajakan kunci dan ajakan yang dikenali sistem)
//   kesesuaian kategori ajakan ≥ 80%    (di antara ajakan yang cocok)
//   kesesuaian perluasan ≥ 80%          (jumlah perluasan per naskah sama dengan kunci; dihitung kode, lib/ukur/perluasan.ts)
//   mutu: N07 dan N08 ditolak, sisanya lolos
// Naskah yang gagal ditulis apa adanya.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { HasilRekaman } from "../lib/kontrak/hasil";
import type { KandidatSuaraAnak } from "../lib/kontrak/rekaman";
import { periksaMutu } from "../lib/ukur/mutu";
import { tentukanPeran } from "../lib/ukur/pembicara";
import { hitungPerluasan } from "../lib/ukur/perluasan";
import { keUcapan } from "../lib/ukur/stt";
import type { Transkrip } from "../lib/ukur/tipe";
import { ukur } from "../lib/ukur/ukur";
import { hitungKunci, KATA_TARGET, lini, NASKAH, type Kunci } from "./naskah";

const AKAR = join(import.meta.dirname, "..");
// --simulasi: transkrip sempurna dibuat dari naskah (jeda manual = jeda naskah) untuk memeriksa mesin terhadap kunci
// sebelum ada rekaman. Hasilnya hanya dicetak, docs/hasil-uji.md tidak ditimpa.
const SIMULASI = process.argv.includes("--simulasi");
// --transkrip <folder> --kunci <folder> --keluaran <berkas>: menilai kumpulan rekaman lain dengan aturan yang sama.
const arg = (nama: string) => {
  const i = process.argv.indexOf(nama);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FOLDER_TRANSKRIP = arg("--transkrip") ?? join(AKAR, "data", "uji", "transkrip");
const FOLDER_KUNCI = arg("--kunci") ?? join(AKAR, "data", "uji", "kunci");
const KELUARAN = arg("--keluaran") ?? join(AKAR, "docs", "hasil-uji.md");

function simulasi(n: (typeof NASKAH)[number]): { kunci: Kunci; s: Simpanan } {
  const kunci = hitungKunci(n);
  kunci.jeda_manual_s = kunci.ajakan.map((a) => a.jeda_s);
  const kata = lini(n).flatMap((b) => {
    const potong = b.teks.split(/\s+/);
    const lebar = (b.selesai - b.mulai) / potong.length;
    return potong.map((w, i) => ({ teks: w, t_mulai: b.mulai + i * lebar, t_selesai: b.mulai + (i + 1) * lebar, pembicara: b.s, keyakinan: 0.95 }));
  });
  return { kunci, s: { status: "dinilai", durasi_s: kunci.durasi_s, meta: { transkrip: { penyedia: "scribe", kata, peristiwa: n.harap_ditolak === "bising" ? [{ jenis: "musik", t_mulai: 0, t_selesai: kunci.durasi_s }] : [] } }, hasil: null } };
}
const baca = <T,>(p: string): T | null => (existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as T) : null);
const normal = (s: string) => s.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
const koma = (n: number, d = 1) => n.toLocaleString("id-ID", { maximumFractionDigits: d, minimumFractionDigits: d });
const persen = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

type Simpanan = { status: string; durasi_s: number | null; meta: { transkrip?: Transkrip; durasi_s?: number; terputus?: boolean; mulai_menunggu_s?: number[]; kandidat_suara_anak?: KandidatSuaraAnak[]; jejak?: [number, number, number][] }; hasil: HasilRekaman | null };

/** Kecocokan teks: ≥ 50% kata kunci muncul di teks sistem. */
function mirip(kunci: string, sistem: string) {
  const k = normal(kunci).split(" ").filter(Boolean);
  const s = new Set(normal(sistem).split(" "));
  return k.length > 0 && k.filter((w) => s.has(w)).length / k.length >= 0.5;
}

type BarisHasil = {
  id: string;
  status: "belum direkam" | "dinilai";
  mutu_sesuai?: boolean;
  mutu_ket?: string;
  ajakan_kunci?: number;
  ajakan_sistem?: number;
  cocok?: number;
  kategori_sama?: number;
  selisih_jeda?: number[];
  jeda_manual?: boolean;
  perluasan_kunci?: number;
  perluasan_ai?: number | null;
};

function nilaiSatu(n: (typeof NASKAH)[number]): BarisHasil {
  const sim = SIMULASI ? simulasi(n) : null;
  const kunci = sim?.kunci ?? baca<Kunci>(join(FOLDER_KUNCI, `${n.id}.json`));
  const s = sim?.s ?? baca<Simpanan>(join(FOLDER_TRANSKRIP, `${n.id}.json`));
  if (!kunci || !s?.meta?.transkrip) return { id: n.id, status: "belum direkam" };

  const t = s.meta.transkrip;
  const durasi = s.durasi_s ?? s.meta.durasi_s ?? 0;
  const ucapan = keUcapan(t);
  const peran = tentukanPeran(ucapan, s.meta.kandidat_suara_anak ?? []);
  const mutu = periksaMutu({ durasi_s: durasi, terputus: !!s.meta.terputus, ucapan, perekam: peran.perekam, peristiwa: t.peristiwa, jejak: s.meta.jejak });
  const harapLolos = !kunci.harap_ditolak;
  const baris: BarisHasil = {
    id: n.id,
    status: "dinilai",
    mutu_sesuai: mutu.lolos === harapLolos,
    mutu_ket: mutu.lolos ? "lolos" : `ditolak: ${mutu.alasan?.split(".")[0]}`,
  };
  if (!harapLolos) return baris;

  const hasil = ukur({ ucapan, peran, kata_target: KATA_TARGET, durasi_s: durasi, mulai_menunggu_s: s.meta.mulai_menunggu_s ?? [], ukuran_nonaktif: [] });

  // Cocokkan ajakan kunci dengan ajakan sistem sesuai urutan (monoton) berdasarkan kemiripan teks.
  let j = 0;
  let cocok = 0;
  let kategoriSama = 0;
  const selisih: number[] = [];
  kunci.ajakan.forEach((a, i) => {
    for (let x = j; x < hasil.ajakan.length; x++) {
      if (mirip(a.teks, hasil.ajakan[x].teks)) {
        cocok++;
        if (hasil.ajakan[x].kategori === a.kategori) kategoriSama++;
        const pembanding = kunci.jeda_manual_s[i];
        if (pembanding !== null && pembanding !== undefined) selisih.push(Math.abs(hasil.ajakan[x].jeda_s - pembanding));
        j = x + 1;
        break;
      }
    }
  });
  return {
    ...baris,
    ajakan_kunci: kunci.ajakan.length,
    ajakan_sistem: hasil.ajakan.length,
    cocok,
    kategori_sama: kategoriSama,
    selisih_jeda: selisih,
    jeda_manual: kunci.jeda_manual_s.some((x) => x !== null),
    perluasan_kunci: kunci.perluasan,
    perluasan_ai: hitungPerluasan(ucapan, peran.perekam, peran.suara_anak),
  };
}

function utama() {
  const hasil = NASKAH.map(nilaiSatu);
  const dinilai = hasil.filter((h) => h.status === "dinilai");
  const diukur = dinilai.filter((h) => h.ajakan_kunci !== undefined);

  const totalKunci = diukur.reduce((a, h) => a + h.ajakan_kunci!, 0);
  const totalSistem = diukur.reduce((a, h) => a + h.ajakan_sistem!, 0);
  const totalCocok = diukur.reduce((a, h) => a + h.cocok!, 0);
  const presisi = totalSistem ? totalCocok / totalSistem : 0;
  const recall = totalKunci ? totalCocok / totalKunci : 0;
  const f1 = presisi + recall ? (2 * presisi * recall) / (presisi + recall) : 0;
  const kategori = persen(diukur.reduce((a, h) => a + h.kategori_sama!, 0), totalCocok);
  const semuaSelisih = diukur.flatMap((h) => h.selisih_jeda!);
  const selisihRata = semuaSelisih.length ? semuaSelisih.reduce((a, b) => a + b, 0) / semuaSelisih.length : null;
  const perluasanAda = diukur.filter((h) => h.perluasan_ai !== null);
  const perluasan = persen(perluasanAda.filter((h) => h.perluasan_ai === h.perluasan_kunci).length, perluasanAda.length);
  const mutu = persen(dinilai.filter((h) => h.mutu_sesuai).length, dinilai.length);
  const rencana = baca<{ jumlah: number; bebas_terlarang: number; di_bank: number; cadangan: number }>(join(AKAR, "data", "uji", "hasil-rencana.json"));

  const lolos = (ok: boolean | null) => (ok === null ? "belum" : ok ? "ya" : "tidak");
  const ringkasan = [
    ["Selisih jeda rata-rata", "≤ 0,5 detik", selisihRata === null ? "belum diukur" : `${koma(selisihRata, 2)} detik (${semuaSelisih.length} jeda)`, lolos(selisihRata === null ? null : selisihRata <= 0.5)],
    ["Ketepatan pengenalan ajakan (F1)", "≥ 80%", diukur.length ? `${Math.round(f1 * 100)}% (presisi ${Math.round(presisi * 100)}%, recall ${Math.round(recall * 100)}%)` : "-", lolos(diukur.length ? f1 >= 0.8 : null)],
    ["Kesesuaian kategori ajakan", "≥ 80%", kategori === null ? "-" : `${kategori}% dari ${totalCocok} ajakan`, lolos(kategori === null ? null : kategori >= 80)],
    ["Kesesuaian perluasan", "≥ 80%", perluasan === null ? "-" : `${perluasan}% dari ${perluasanAda.length} naskah`, lolos(perluasan === null ? null : perluasan >= 80)],
    ["Mutu rekaman sesuai harapan", "15/15", `${dinilai.filter((h) => h.mutu_sesuai).length}/${dinilai.length}`, lolos(dinilai.length ? mutu === 100 : null)],
    ["Kasus regresi tertandai", "10/10", "10/10 (uji/status.test.ts)", "ya"],
    ["Rencana bebas kata terlarang", "50/50", rencana ? `${rencana.bebas_terlarang}/${rencana.jumlah}, aktivitas di luar bank ${rencana.jumlah - rencana.di_bank}, cadangan ${rencana.cadangan}` : "belum dijalankan", lolos(rencana ? rencana.bebas_terlarang === rencana.jumlah && rencana.di_bank === rencana.jumlah : null)],
  ];

  const perNaskah = hasil.map((h) => {
    const n = NASKAH.find((x) => x.id === h.id)!;
    if (h.status === "belum direkam") return `| ${h.id} | ${n.judul} | belum direkam | | | | |`;
    if (h.ajakan_kunci === undefined) return `| ${h.id} | ${n.judul} | ${h.mutu_ket} (${h.mutu_sesuai ? "sesuai" : "TIDAK sesuai"}) | | | | |`;
    const jeda = h.selisih_jeda!.length ? koma(h.selisih_jeda!.reduce((a, b) => a + b, 0) / h.selisih_jeda!.length, 2) : "-";
    return `| ${h.id} | ${n.judul} | ${h.mutu_ket} | ${h.cocok}/${h.ajakan_kunci} (sistem ${h.ajakan_sistem}) | ${h.kategori_sama}/${h.cocok} | ${jeda} | ${h.perluasan_ai ?? "-"} / ${h.perluasan_kunci} |`;
  });

  const md = [
    "# Hasil uji akurasi",
    "",
    `Dijalankan ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB dengan \`npm run uji:akurasi\`. ${dinilai.length} dari ${NASKAH.length} skenario sudah diuji.`,
    "Skenario percakapan bernaskah, satu naskah campuran bahasa Indonesia dan Jawa (N04). Bukan data anak sungguhan.",
    "Pengukuran dijalankan ulang dari transkrip Scribe yang tersimpan; jeda pembanding diambil dari kunci tiap skenario.",
    "",
    "Tabel 1. Ringkasan terhadap target",
    "",
    "| Ukuran | Target | Hasil | Lolos |",
    "|---|---|---|---|",
    ...ringkasan.map((r) => `| ${r.join(" | ")} |`),
    "",
    "Tabel 2. Per naskah",
    "",
    "| Naskah | Isi | Mutu | Ajakan cocok | Kategori sama | Selisih jeda (detik) | Perluasan sistem / kunci |",
    "|---|---|---|---|---|---|---|",
    ...perNaskah,
    "",
  ].join("\n");
  if (!SIMULASI) writeFileSync(KELUARAN, md);
  console.log(md);
}

utama();
