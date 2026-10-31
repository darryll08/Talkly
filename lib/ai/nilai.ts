import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { UmpanBalik, Ukuran } from "@/lib/kontrak/hasil";
import type { HasilUkur } from "@/lib/ukur/ukur";
import { hitungPerluasan } from "@/lib/ukur/perluasan";
import type { Ucapan } from "@/lib/ukur/tipe";
import { buatPeta, kembalikanAnak, samarkan } from "./samaran";
import { isiTemplat, kandidat, pilihCadangan, TEMPLAT } from "./templat";
import { MAKS_KATA_VERSI_ANAK, periksaKeluaran } from "./validasi";

// Penilaian satu rekaman (A4.1): satu panggilan GPT-6 Luna, batas 8 detik, tanpa retry.
// AI hanya memilih templat dari kandidat, memberi kutipan, kalimat versi anak, perkiraan perluasan, dan laporan terapis.
// Gagal, lewat batas waktu, ragu, atau tidak lolos validasi → templat cadangan dan status anak naik.

export const MODEL = "gpt-6-luna";
const BATAS_MS = 8_000;

const SkemaKeluaran = z.object({
  pujian_id: z.string(),
  saran_id: z.string(),
  kutipan: z.string().describe("Kalimat perekam yang disalin persis dari transkrip, atau kosong"),
  versi_anak: z.string().describe("Satu kalimat perekam yang disesuaikan dengan tahap bahasa anak"),
  perluasan_ai: z.number().int().describe("Berapa kali perekam menanggapi suara anak dengan menambah kata"),
  laporan_terapis: z.string().describe("Ringkasan 1-2 kalimat untuk terapis, tanpa diagnosis"),
  ragu: z.boolean().describe("true bila transkrip tidak cukup jelas untuk dinilai"),
});

export type MasukanNilai = {
  ucapan: Ucapan[];
  perekam: string | null;
  suara_anak: { t_mulai: number; t_selesai: number }[];
  ukur: HasilUkur;
  anak: { nama: string; tahap: number; kata_target: string[] };
  nama_anggota: { nama: string; peran: string }[];
  sapaan: string;
};

export type HasilNilai = {
  umpan_balik: UmpanBalik;
  perluasan_ai: number;
  laporan_terapis: string;
  naikkan_status: boolean;
  catatan: string[];
};

/** Kata target yang paling sering diucapkan perekam, untuk isian {kata}. */
function kataUtama(ucapan: Ucapan[], perekam: string | null, kataTarget: string[]) {
  const teks = ucapan
    .filter((u) => u.pembicara === perekam)
    .map((u) => u.teks.toLowerCase())
    .join(" ");
  const hitung = kataTarget.map((k) => [k, (teks.match(new RegExp(`\\b${k.toLowerCase()}\\b`, "g")) ?? []).length] as const);
  return hitung.sort((a, b) => b[1] - a[1])[0]?.[0] ?? kataTarget[0] ?? "";
}

function transkripUntukAi(m: MasukanNilai) {
  // Ucapan yang rentangnya sama dengan suara anak (sumber label) ditulis sebagai ANAK beserta katanya, supaya AI
  // bisa melihat perekam mengulang dan menambah kata anak. Suara anak dari celah hening tidak punya teks.
  const samaRentang = (u: Ucapan, s: { t_mulai: number; t_selesai: number }) =>
    Math.abs(u.t_mulai - s.t_mulai) < 0.05 && Math.abs(u.t_selesai - s.t_selesai) < 0.05;
  const ucapanAnak = new Set(m.ucapan.filter((u) => m.suara_anak.some((s) => samaRentang(u, s))));
  const baris = [
    ...m.ucapan.map((u) => ({
      t: u.t_mulai,
      teks: `[${u.t_mulai.toFixed(1)}] ${ucapanAnak.has(u) ? "ANAK" : u.pembicara === m.perekam ? "PEREKAM" : "DEWASA_LAIN"}: ${u.teks}`,
    })),
    ...m.suara_anak
      .filter((s) => ![...ucapanAnak].some((u) => samaRentang(u, s)))
      .map((s) => ({ t: s.t_mulai, teks: `[${s.t_mulai.toFixed(1)}] ANAK: (bersuara)` })),
  ].sort((a, b) => a.t - b.t);
  return baris.map((b) => b.teks).join("\n");
}

export function nilaiCadangan(m: MasukanNilai, catatan: string[]): HasilNilai {
  const u = m.ukur.ukuran;
  const { pujian, saran } = pilihCadangan(u);
  const kata = kataUtama(m.ucapan, m.perekam, m.anak.kata_target);
  const isian = { sapaan: m.sapaan, anak: m.anak.nama, kata, ukuran: u, kutipan: "" };
  const versi = kata ? `${kata.charAt(0).toUpperCase()}${kata.slice(1)}!` : "";
  return {
    umpan_balik: {
      pujian_id: pujian.id,
      saran_id: saran.id,
      teks_pujian: isiTemplat(pujian, isian),
      teks_saran: isiTemplat(saran, isian),
      kutipan: m.ukur.kandidat_versi_anak[0] ?? "",
      versi_anak: versi,
      momen: m.ukur.momen,
      sumber: "cadangan",
    },
    perluasan_ai: hitungPerluasan(m.ucapan, m.perekam, m.suara_anak),
    laporan_terapis: `Rata-rata jeda ${String(u.jeda_rata_s ?? 0).replace(".", ",")} detik dari ${u.jumlah_ajakan} ajakan, ${u.giliran} giliran, ${u.suruhan_beruntun} suruhan beruntun. Umpan balik memakai templat cadangan.`,
    naikkan_status: true,
    catatan,
  };
}

let klien: OpenAI | null = null;

export async function nilaiRekaman(m: MasukanNilai, panggil?: (input: string, instruksi: string) => Promise<unknown>): Promise<HasilNilai> {
  const u = m.ukur.ukuran;
  const k = kandidat(u);
  const peta = buatPeta({ anak: m.anak.nama, anggota: m.nama_anggota });
  const transkrip = samarkan(transkripUntukAi(m), peta);
  const kataTarget = m.anak.kata_target;

  const instruksi = [
    "Anda membantu terapis wicara anak menilai rekaman satu menit interaksi orang tua (PEREKAM) dengan anak.",
    "Yang dinilai adalah strategi perekam, bukan kemampuan anak. Jangan menyebut diagnosis, skor, atau kata 'terlambat'.",
    "Pilih tepat satu pujian_id dan satu saran_id dari daftar yang diberikan. Jangan menulis kalimat umpan balik sendiri.",
    "kutipan: salin persis satu kalimat PEREKAM dari transkrip yang paling mendukung pujian. Wajib bila templat memuat {kutipan}.",
    `versi_anak: ubah satu kalimat perekam menjadi kalimat untuk anak tahap ${m.anak.tahap}: paling banyak ${MAKS_KATA_VERSI_ANAK[m.anak.tahap] ?? 8} kata, memuat salah satu kata target (${kataTarget.join(", ")}), tanpa tanda tanya dan tanpa kata "ayo" atau "bilang". Contoh tahap 1: "Bebek… mandi!"`,
    `perluasan_ai: hitung berapa kali ucapan PEREKAM tepat setelah ANAK bersuara mengulang kata anak (atau bentuk utuhnya) lalu menambah paling sedikit satu kata baru (0 sampai ${u.vokalisasi_anak}). Contoh dihitung: ANAK "Bek." → PEREKAM "Iya bebek, bebek mandi." Tidak dihitung: hanya mengulang ("Lagi.") atau tidak menyambung kata anak.`,
    "laporan_terapis: 1-2 kalimat fakta untuk terapis. ragu: true bila transkrip terlalu kacau untuk dinilai.",
  ].join("\n");

  const input = JSON.stringify({
    transkrip,
    ukuran: u,
    kata_target: kataTarget,
    tahap: m.anak.tahap,
    templat_pujian: k.pujian.map((t) => ({ id: t.id, pemicu: t.pemicu, teks: t.teks })),
    templat_saran: k.saran.map((t) => ({ id: t.id, pemicu: t.pemicu, teks: t.teks })),
  });

  let mentah: unknown;
  try {
    mentah = panggil ? await panggil(input, instruksi) : await panggilOpenAi(input, instruksi);
  } catch (e) {
    return nilaiCadangan(m, [`AI gagal: ${(e as Error).message}`]);
  }
  const parsed = SkemaKeluaran.safeParse(mentah);
  if (!parsed.success) return nilaiCadangan(m, ["keluaran AI tidak sesuai skema"]);
  const out = parsed.data;

  const pujian = TEMPLAT.find((t) => t.id === out.pujian_id);
  const saran = TEMPLAT.find((t) => t.id === out.saran_id);
  const transkripPerekam = samarkan(
    m.ucapan
      .filter((x) => x.pembicara === m.perekam)
      .map((x) => x.teks)
      .join(" "),
    peta,
  );
  const masalah = periksaKeluaran(out, {
    pujianBoleh: k.pujian.map((t) => t.id),
    saranBoleh: k.saran.map((t) => t.id),
    butuhKutipan: !!(pujian?.teks.includes("{kutipan}") || saran?.teks.includes("{kutipan}")),
    transkripPerekam,
    tahap: m.anak.tahap,
    kataTarget,
    vokalisasiAnak: u.vokalisasi_anak,
  });
  if (masalah.length || !pujian || !saran) return nilaiCadangan(m, masalah);

  const kutipan = kembalikanAnak(out.kutipan.trim(), m.anak.nama);
  const ukuranLengkap: Omit<Ukuran, "perluasan_ai"> = u;
  const isian = { sapaan: m.sapaan, anak: m.anak.nama, kata: kataUtama(m.ucapan, m.perekam, kataTarget), ukuran: ukuranLengkap, kutipan };
  return {
    umpan_balik: {
      pujian_id: pujian.id,
      saran_id: saran.id,
      teks_pujian: isiTemplat(pujian, isian),
      teks_saran: isiTemplat(saran, isian),
      kutipan,
      versi_anak: kembalikanAnak(out.versi_anak.trim(), m.anak.nama),
      momen: m.ukur.momen,
      sumber: "ai",
    },
    // Angka perluasan dari kode (lib/ukur/perluasan.ts); perkiraan AI hanya divalidasi rentangnya.
    perluasan_ai: hitungPerluasan(m.ucapan, m.perekam, m.suara_anak),
    laporan_terapis: kembalikanAnak(out.laporan_terapis.trim(), m.anak.nama),
    naikkan_status: false,
    catatan: [],
  };
}

async function panggilOpenAi(input: string, instruksi: string): Promise<unknown> {
  klien ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: BATAS_MS, maxRetries: 0 });
  const res = await klien.responses.parse({
    model: MODEL,
    instructions: instruksi,
    input,
    reasoning: { effort: "none" },
    text: { format: zodTextFormat(SkemaKeluaran, "penilaian_rekaman") },
  });
  return res.output_parsed;
}
