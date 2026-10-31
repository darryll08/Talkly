import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { kataTerlarangDi } from "@/lib/kontrak/konten";
import { BANK, ID_BANK } from "@/lib/terapis/program";
import { MODEL } from "./nilai";
import { buatPeta, kembalikanAnak, samarkan } from "./samaran";

// Draf rencana minggu depan (A4.2): AI memilih 1–3 aktivitas per anggota hanya dari bank aktivitas, menulis pesan
// untuk keluarga, dan alasan setiap pilihan. AI tidak bisa mengubah tahap atau status. Draf baru dikirim setelah
// terapis menyetujui. Gagal atau tidak lolos validasi → draf cadangan berisi rencana yang sedang berjalan.

const BATAS_MS = 8_000;

const SkemaDraf = z.object({
  item: z.array(z.object({ aktivitas_id: z.string(), anggota_id: z.string().nullable(), urutan: z.number().int() })),
  pesan_keluarga: z.string(),
  dasar: z.array(z.object({ aktivitas_id: z.string(), alasan: z.string() })),
});
export type IsiDraf = { item: { aktivitas_id: string; anggota_id: string | null; urutan: number }[]; pesan_keluarga: string };
export type Draf = { isi: IsiDraf; dasar: { aktivitas_id: string; alasan: string }[]; sumber: "ai" | "cadangan"; catatan: string[] };

export type MasukanDraf = {
  anak: { nama: string; tahap: number; kata_target: string[]; strategi_fokus: string; minat: string; rutinitas: string };
  anggota: { id: string; nama: string; peran: string }[];
  catatan_sesi: string;
  ringkasan_7_hari: string;
  rencana_berjalan: IsiDraf["item"];
};

/** Validasi draf; kosong = lolos. */
export function periksaDraf(d: z.infer<typeof SkemaDraf>, anggotaIds: string[]): string[] {
  const masalah: string[] = [];
  if (d.item.length < 1 || d.item.length > 12) masalah.push("jumlah aktivitas di luar 1–12");
  for (const i of d.item) {
    if (!ID_BANK.has(i.aktivitas_id)) masalah.push(`aktivitas ${i.aktivitas_id} di luar bank`);
    if (i.anggota_id !== null && !anggotaIds.includes(i.anggota_id)) masalah.push(`anggota ${i.anggota_id} tidak dikenal`);
  }
  const perAnggota = new Map<string, number>();
  for (const i of d.item) perAnggota.set(i.anggota_id ?? "semua", (perAnggota.get(i.anggota_id ?? "semua") ?? 0) + 1);
  if ([...perAnggota.values()].some((n) => n > 3)) masalah.push("lebih dari 3 aktivitas untuk satu anggota");
  const teks = [d.pesan_keluarga, ...d.dasar.map((x) => x.alasan)];
  const terlarang = teks.flatMap(kataTerlarangDi);
  if (terlarang.length) masalah.push(`kata terlarang: ${[...new Set(terlarang)].join(", ")}`);
  if (!d.pesan_keluarga.trim() || d.pesan_keluarga.length > 500) masalah.push("pesan keluarga kosong atau terlalu panjang");
  return masalah;
}

export function drafCadangan(m: MasukanDraf, catatan: string[]): Draf {
  const item = m.rencana_berjalan.length ? m.rencana_berjalan : BANK.filter((a) => a.tahap === m.anak.tahap).slice(0, 2).map((a, i) => ({ aktivitas_id: a.id, anggota_id: null, urutan: i + 1 }));
  return {
    isi: { item, pesan_keluarga: "Minggu ini kita lanjutkan aktivitas yang sama. Ingat, setelah mengajak, diam dulu sampai hitungan lima." },
    dasar: item.map((i) => ({ aktivitas_id: i.aktivitas_id, alasan: "Rencana minggu ini dilanjutkan karena draf otomatis tidak tersedia." })),
    sumber: "cadangan",
    catatan,
  };
}

let klien: OpenAI | null = null;

export async function susunDraf(m: MasukanDraf, panggil?: (input: string, instruksi: string) => Promise<unknown>): Promise<Draf> {
  const peta = buatPeta({ anak: m.anak.nama, anggota: m.anggota });
  const bank = BANK.filter((a) => Math.abs(a.tahap - m.anak.tahap) <= 1).map(({ id, judul, rutinitas, tahap }) => ({ id, judul, rutinitas, tahap }));
  const instruksi = [
    "Anda menyusun DRAF rencana latihan bicara minggu depan untuk disetujui terapis wicara.",
    "Pilih 1–3 aktivitas per anggota keluarga HANYA dari bank_aktivitas (pakai id persis). anggota_id null berarti untuk semua.",
    "Pertimbangkan catatan sesi terapis, ringkasan 7 hari, rutinitas, dan minat anak. Jangan mengubah tahap atau target.",
    "pesan_keluarga: 1–2 kalimat hangat dan konkret untuk keluarga, tanpa kata HP, video, hukuman, salah, gagal, atau diagnosis.",
    "dasar: satu alasan singkat untuk setiap aktivitas yang dipilih, berdasarkan data.",
  ].join("\n");
  const input = samarkan(
    JSON.stringify({
      anak: { tahap: m.anak.tahap, kata_target: m.anak.kata_target, strategi_fokus: m.anak.strategi_fokus, minat: m.anak.minat, rutinitas: m.anak.rutinitas },
      anggota: m.anggota.map((a) => ({ anggota_id: a.id, peran: a.peran })),
      catatan_sesi: m.catatan_sesi,
      ringkasan_7_hari: m.ringkasan_7_hari,
      rencana_berjalan: m.rencana_berjalan,
      bank_aktivitas: bank,
    }),
    peta,
  );

  let mentah: unknown;
  try {
    mentah = panggil ? await panggil(input, instruksi) : await panggilOpenAi(input, instruksi);
  } catch (e) {
    return drafCadangan(m, [`AI gagal: ${(e as Error).message}`]);
  }
  const parsed = SkemaDraf.safeParse(mentah);
  if (!parsed.success) return drafCadangan(m, ["keluaran AI tidak sesuai skema"]);
  const masalah = periksaDraf(parsed.data, m.anggota.map((a) => a.id));
  if (masalah.length) return drafCadangan(m, masalah);

  const item = parsed.data.item.map((x, i) => ({ ...x, urutan: i + 1 }));
  return {
    isi: { item, pesan_keluarga: kembalikanAnak(parsed.data.pesan_keluarga.trim(), m.anak.nama) },
    dasar: parsed.data.dasar.map((x) => ({ aktivitas_id: x.aktivitas_id, alasan: kembalikanAnak(x.alasan, m.anak.nama) })),
    sumber: "ai",
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
    text: { format: zodTextFormat(SkemaDraf, "draf_rencana") },
  });
  return res.output_parsed;
}
