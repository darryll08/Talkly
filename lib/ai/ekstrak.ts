import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { kataTerlarangDi } from "@/lib/kontrak/konten";
import { MAKS_KATA_VERSI_ANAK, normal } from "./validasi";
import { MODEL } from "./nilai";
import { buatPeta, kembalikanAnak, samarkan } from "./samaran";

// Dua tugas AI kecil (A4.3), masing-masing satu panggilan dengan batas 5 detik dan cadangan aturan:
//   * ekstrakUcapanAnak: kata yang diucapkan anak dari catatan malam bebas. Setiap kata wajib muncul di catatan.
//   * kartuBenda: dari NAMA benda saja (foto tidak pernah dikirim), kata sesuai tahap + 2–3 kalimat contoh.

const BATAS_MS = 5_000;
let klien: OpenAI | null = null;
const openai = () => (klien ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: BATAS_MS, maxRetries: 0 }));
type Panggil = (input: string, instruksi: string) => Promise<unknown>;

// ---------- Ekstraksi ucapan anak ----------

const SkemaEkstrak = z.object({ kata: z.array(z.string()) });

/** Cadangan: kata dalam tanda kutip, atau satu kata setelah "bilang"/"sebut"/"ngomong". */
export function ekstrakAturan(catatan: string): string[] {
  const hasil = new Set<string>();
  for (const m of catatan.matchAll(/["'“‘]([\p{L}]{2,15})["'”’]/gu)) hasil.add(m[1].toLowerCase());
  for (const m of catatan.matchAll(/\b(?:bilang|sebut|menyebut|ngomong|ucap(?:kan)?)\s+([\p{L}]{2,15})/giu)) {
    const k = m[1].toLowerCase();
    if (!["apa", "dong", "ayo", "lagi", "sama", "ke", "terus", "kalau"].includes(k)) hasil.add(k);
  }
  return [...hasil];
}

export async function ekstrakUcapanAnak(catatan: string, namaAnak: string, panggil?: Panggil): Promise<string[]> {
  if (!catatan.trim()) return [];
  const cadangan = ekstrakAturan(catatan);
  const instruksi =
    "Dari catatan orang tua, ambil kata atau suku kata yang DIUCAPKAN anak (adik), persis seperti tertulis. Jangan menyertakan kata orang tua. Kembalikan daftar kosong bila tidak ada.";
  let mentah: unknown;
  try {
    const input = samarkan(catatan, buatPeta({ anak: namaAnak, anggota: [] }));
    mentah = panggil ? await panggil(input, instruksi) : await panggilOpenAi(input, instruksi, SkemaEkstrak, "ucapan_anak");
  } catch {
    return cadangan;
  }
  const p = SkemaEkstrak.safeParse(mentah);
  if (!p.success) return cadangan;
  const teks = normal(catatan);
  // Validasi: setiap kata harus ada di catatan dan pendek; selain itu dibuang.
  const sah = p.data.kata.map((k) => normal(k)).filter((k) => k && k.split(" ").length <= 2 && k.length <= 20 && teks.includes(k) && !kataTerlarangDi(k).length);
  return [...new Set(sah)].slice(0, 10);
}

// ---------- Kartu benda ----------

const SkemaBenda = z.object({ kata: z.string(), contoh_kalimat: z.array(z.string()) });

export function bendaAturan(namaBenda: string, tahap: number, kataTarget: string[]) {
  // Nama kartu paling banyak dua kata, misalnya "mobil merah" atau "bola besar".
  const nama = normal(namaBenda).split(" ").filter(Boolean).slice(0, 2).join(" ") || normal(namaBenda);
  const kata = kataTarget.find((k) => normal(namaBenda).includes(k.toLowerCase())) ?? nama;
  const K = kata.charAt(0).toUpperCase() + kata.slice(1);
  const contoh =
    tahap <= 1 ? [`${K}!`, `${K}… lagi!`, `Mau ${kata}`] : tahap === 2 ? [`${K} lagi!`, `Mau ${kata}`, `${K} mana?`] : [`Ini ${kata} kamu`, `${K} ada di sini`, `Ayo main ${kata}`];
  return { kata, contoh_kalimat: contoh.filter((c) => !/\bayo\b/i.test(c)).slice(0, 3) };
}

export async function kartuBenda(namaBenda: string, anak: { nama: string; tahap: number; kata_target: string[] }, panggil?: Panggil) {
  const cadangan = bendaAturan(namaBenda, anak.tahap, anak.kata_target);
  const maks = MAKS_KATA_VERSI_ANAK[anak.tahap] ?? 8;
  const instruksi = [
    `Orang tua memotret benda kesukaan anak dan mengetik namanya. Anak berada di tahap bahasa ${anak.tahap}.`,
    `kata: nama benda itu dalam dua kata (benda + ciri), misalnya "mobil merah" atau "bola besar"; satu kata saja bila nama yang diketik memang satu kata dan tidak ada ciri yang jelas. Pakai salah satu kata target (${anak.kata_target.join(", ")}) sebagai kata pertama bila cocok.`,
    `contoh_kalimat: 2–3 kalimat untuk diucapkan orang tua sambil menunjuk benda, masing-masing paling banyak ${maks} kata, memuat kata itu, tanpa "ayo" atau "bilang"${anak.tahap === 1 ? ", tanpa tanda tanya" : ""}.`,
  ].join("\n");
  let mentah: unknown;
  try {
    mentah = panggil ? await panggil(JSON.stringify({ nama_benda: namaBenda }), instruksi) : await panggilOpenAi(JSON.stringify({ nama_benda: namaBenda }), instruksi, SkemaBenda, "kartu_benda");
  } catch {
    return cadangan;
  }
  const p = SkemaBenda.safeParse(mentah);
  if (!p.success) return cadangan;
  const kata = normal(p.data.kata);
  const contoh = p.data.contoh_kalimat
    .map((c) => kembalikanAnak(c.trim(), anak.nama))
    .filter((c) => {
      const n = normal(c);
      return n.split(" ").length <= maks && n.includes(kata) && !/\bayo\b|\bbilang\b/.test(n) && !(anak.tahap === 1 && c.includes("?")) && !kataTerlarangDi(c).length;
    });
  if (!kata || kata.split(" ").length > 2 || contoh.length < 2 || kataTerlarangDi(kata).length) return cadangan;
  return { kata, contoh_kalimat: contoh.slice(0, 3) };
}

async function panggilOpenAi<S extends z.ZodType>(input: string, instruksi: string, skema: S, nama: string): Promise<unknown> {
  const res = await openai().responses.parse({
    model: MODEL,
    instructions: instruksi,
    input,
    reasoning: { effort: "none" },
    text: { format: zodTextFormat(skema, nama) },
  });
  return res.output_parsed;
}
