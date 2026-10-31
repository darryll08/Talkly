import type { StatusAnak } from "@/lib/kontrak/api";

// Aturan status anak (proposal Tabel 2). Fungsi murni: fakta masuk, status dan pemicu keluar.
// AI tidak pernah memanggil ini untuk menurunkan status; penurunan hanya lewat terapis di Setelah sesi.

export type Fakta = {
  regresi: boolean;
  tidak_aktif_dua_sesi: boolean;
  perubahan_baru: string | null; // misal "Pengasuh baru: Mbak Sri"
  pendengaran_belum_diperiksa: boolean;
  hari_tidak_aktif: number;
  minggu_tanpa_kata_baru: number;
  hari_berturut_lebih_sedikit_bersuara: number;
  ditolak_berturut: number;
  kurang_tepat_7_hari: boolean;
  ai_ragu: boolean;
};

export const FAKTA_KOSONG: Fakta = {
  regresi: false,
  tidak_aktif_dua_sesi: false,
  perubahan_baru: null,
  pendengaran_belum_diperiksa: false,
  hari_tidak_aktif: 0,
  minggu_tanpa_kata_baru: 0,
  hari_berturut_lebih_sedikit_bersuara: 0,
  ditolak_berturut: 0,
  kurang_tepat_7_hari: false,
  ai_ragu: false,
};

export const HARI_TIDAK_AKTIF_MAKS = 4;

export function tentukanStatus(f: Fakta): { status: StatusAnak; pemicu: string | null } {
  if (f.regresi) return { status: "bahas_minggu_ini", pemicu: "Regresi dilaporkan keluarga" };
  if (f.tidak_aktif_dua_sesi) return { status: "bahas_minggu_ini", pemicu: "Keluarga tidak aktif dua sesi berturut-turut" };

  const meninjau: [boolean, string][] = [
    [!!f.perubahan_baru, f.perubahan_baru ?? ""],
    [f.pendengaran_belum_diperiksa, "Pendengaran belum diperiksa"],
    [f.hari_tidak_aktif >= HARI_TIDAK_AKTIF_MAKS, `Keluarga tidak aktif ${f.hari_tidak_aktif} hari`],
    [f.minggu_tanpa_kata_baru >= 3, "Kata anak tidak bertambah selama tiga minggu"],
    [f.hari_berturut_lebih_sedikit_bersuara >= 3, "Anak dilaporkan lebih sedikit bersuara tiga hari berturut-turut"],
    [f.ditolak_berturut >= 3, "Rekaman ditolak tiga kali berturut-turut"],
    [f.kurang_tepat_7_hari, "Hasil ditandai kurang tepat"],
    [f.ai_ragu, "Keluaran AI meragukan"],
  ];
  const kena = meninjau.find(([ya]) => ya);
  if (kena) return { status: "terapis_meninjau", pemicu: kena[1] };
  return { status: "lanjut", pemicu: null };
}

/** Kalimat catatan yang menyiratkan kemampuan yang hilang, misalnya "dulu sudah bisa bilang papa, sekarang tidak lagi". */
const RE_REGRESI = [
  /\bdulu\b.{0,40}\b(bisa|sudah|pernah)\b.{0,60}\b(sekarang|kini|sudah)\b.{0,30}\b(tidak|nggak|ngga|gak|ga|enggak|tak|lupa|hilang|berhenti)\b/i,
  /\b(tidak|nggak|gak|ga|enggak)\b.{0,20}\b(mau|bisa)\b.{0,20}\b(lagi)\b.{0,40}\b(padahal|dulu)\b/i,
  /\b(kata|ucapan)\b.{0,30}\b(hilang|lupa)\b/i,
  /\bsudah\s+(tidak|nggak|gak|ga)\s+(bilang|ngomong|menyebut|mengucap)/i,
];

export function tandaRegresi(teks: string): boolean {
  return RE_REGRESI.some((re) => re.test(teks));
}
