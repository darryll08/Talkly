import type { HasilRekaman } from "@/lib/kontrak/hasil";
import { Laporan } from "@/lib/kontrak/laporan";
import { db } from "@/lib/server/supabase";
import { awalHariWib, seninWib, tanggalWib } from "@/lib/server/waktu";

// Agregat untuk kemajuan (O10) dan kartu anak (D4), proposal S3:
//   * Angka strategi baru tampil setelah ≥ 3 rekaman dan ≥ 30 ajakan dalam 14 hari.
//   * Angka rekaman diberi rentang; persen ajakan berhasil memakai interval Wilson.
//   * Data "Ceritakan sendiri" tidak masuk angka terukur.

export const SYARAT_REKAMAN = 3;
export const SYARAT_AJAKAN = 30;
const HARI_STRATEGI = 14;

export type RekamanDinilai = {
  id: string;
  anggota_id: string;
  dibuat: string;
  durasi_s: number;
  path_audio: string | null;
  status: "antre" | "dinilai" | "ditolak";
  hasil: HasilRekaman | null;
};

const bulat = (n: number) => Math.round(n * 10) / 10;
const rata = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Rata-rata ± 1,96·sd/√n dari nilai per rekaman. */
export function rentangRata(xs: number[]) {
  const m = rata(xs);
  if (m === null) return { nilai: null, bawah: null, atas: null };
  if (xs.length < 2) return { nilai: bulat(m), bawah: null, atas: null };
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
  const e = (1.96 * sd) / Math.sqrt(xs.length);
  return { nilai: bulat(m), bawah: bulat(Math.max(0, m - e)), atas: bulat(m + e) };
}

/** Persen berhasil dengan interval Wilson 95%. */
export function rentangPersen(berhasil: number, total: number) {
  if (total === 0) return { nilai: null, bawah: null, atas: null };
  const z = 1.96;
  const p = berhasil / total;
  const pusat = (p + (z * z) / (2 * total)) / (1 + (z * z) / total);
  const lebar = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / (1 + (z * z) / total);
  return { nilai: Math.round(p * 100), bawah: Math.round(Math.max(0, pusat - lebar) * 100), atas: Math.round(Math.min(1, pusat + lebar) * 100) };
}

export async function muatRekaman(anakId: string, sejakHari: number): Promise<RekamanDinilai[]> {
  const { data, error } = await db()
    .from("rekaman")
    .select("id, anggota_id, dibuat, durasi_s, path_audio, status, hasil:hasil_rekaman (hasil)")
    .eq("anak_id", anakId)
    .gte("dibuat", awalHariWib(tanggalWib(sejakHari)))
    .order("dibuat", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const h = Array.isArray(r.hasil) ? r.hasil[0] : r.hasil;
    return { ...r, durasi_s: r.durasi_s ?? 60, hasil: (h?.hasil as HasilRekaman | undefined) ?? null } as RekamanDinilai;
  });
}

const perMenit = (n: number, durasi: number) => (durasi > 0 ? (n * 60) / durasi : 0);

export function strategi(rekaman: RekamanDinilai[]) {
  const dinilai = rekaman.filter((r) => r.status === "dinilai" && r.hasil?.ukuran && Date.parse(r.dibuat) >= Date.now() - HARI_STRATEGI * 86_400_000);
  const ajakan = dinilai.flatMap((r) => r.hasil!.ajakan);
  const berhasil = ajakan.filter((a) => a.kategori !== "memotong").length;
  return {
    data_cukup: dinilai.length >= SYARAT_REKAMAN && ajakan.length >= SYARAT_AJAKAN,
    rekaman: dinilai.length,
    ajakan: ajakan.length,
    jeda_rata_s: rentangRata(dinilai.map((r) => r.hasil!.ukuran!.jeda_rata_s).filter((x): x is number => x !== null)),
    giliran_per_menit: rentangRata(dinilai.map((r) => perMenit(r.hasil!.ukuran!.giliran, r.durasi_s))),
    ajakan_berhasil_persen: rentangPersen(berhasil, ajakan.length),
    vokalisasi_per_menit: rentangRata(dinilai.map((r) => perMenit(r.hasil!.ukuran!.vokalisasi_anak, r.durasi_s))),
  };
}

/** Tren per minggu (Senin), `minggu` minggu terakhir, urut lama → baru. */
export function tren(rekaman: RekamanDinilai[], minggu = 4) {
  const hasil = [];
  for (let i = minggu - 1; i >= 0; i--) {
    const mulai = seninWib(new Date(Date.now() - i * 7 * 86_400_000));
    const akhir = seninWib(new Date(Date.now() - (i - 1) * 7 * 86_400_000));
    const r = rekaman.filter((x) => {
      const t = tanggalWib(0, new Date(x.dibuat));
      return x.status === "dinilai" && x.hasil?.ukuran && t >= mulai && (i === 0 || t < akhir);
    });
    const jeda = r.flatMap((x) => x.hasil!.ajakan.map((a) => a.jeda_s));
    const gpm = rata(r.map((x) => perMenit(x.hasil!.ukuran!.giliran, x.durasi_s)));
    hasil.push({
      minggu_mulai: mulai,
      jeda_rata_s: jeda.length ? bulat(rata(jeda)!) : null,
      giliran_per_menit: gpm === null ? null : bulat(gpm),
      vokalisasi_per_minggu: r.reduce((n, x) => n + x.hasil!.ukuran!.vokalisasi_anak, 0),
      rekaman: r.length,
    });
  }
  return hasil;
}

export type LaporanBaris = { id: string; tanggal: string; nama: string; regresi: boolean; kata_baru: string[]; laporan: Laporan };

export async function muatLaporan(anakId: string, sejakHari: number): Promise<LaporanBaris[]> {
  const { data, error } = await db()
    .from("laporan_keluarga")
    .select("id, tanggal, jenis, isi, regresi, kata_baru, anggota:anggota_id (nama)")
    .eq("anak_id", anakId)
    .gte("tanggal", tanggalWib(sejakHari))
    .order("tanggal", { ascending: false })
    .order("dibuat", { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((l) => {
    const parsed = Laporan.safeParse({ jenis: l.jenis, isi: l.isi });
    if (!parsed.success) return [];
    const ang = (Array.isArray(l.anggota) ? l.anggota[0] : l.anggota) as { nama: string } | null;
    return [{ id: l.id, tanggal: l.tanggal, nama: ang?.nama ?? "Keluarga", regresi: l.regresi, kata_baru: l.kata_baru ?? [], laporan: parsed.data }];
  });
}

/** Kata yang dilaporkan keluarga, dengan tanggal pertama kali disebut. */
export function kataDilaporkan(laporan: LaporanBaris[]) {
  const pertama = new Map<string, string>();
  for (const l of [...laporan].reverse()) for (const k of l.kata_baru) if (!pertama.has(k.toLowerCase())) pertama.set(k.toLowerCase(), l.tanggal);
  return [...pertama.entries()].map(([kata, sejak]) => ({ kata, sejak }));
}

/** Saran untuk sesi, dari aturan sederhana atas angka dan laporan (bukan AI). */
export function saranSesi(input: {
  namaAnak: string;
  strategi: ReturnType<typeof strategi>;
  tren: ReturnType<typeof tren>;
  rekaman: RekamanDinilai[];
  laporan: LaporanBaris[];
  anggota: { id: string; nama: string; izin_nilai: boolean }[];
}): string[] {
  const s: string[] = [];
  const koma = (n: number) => String(n).replace(".", ",");
  if (input.laporan.some((l) => l.regresi)) s.push(`Tanyakan kata yang dilaporkan hilang dan sejak kapan; kutipannya ada di bawah.`);
  const jeda = input.strategi.jeda_rata_s.nilai;
  if (jeda !== null && jeda < 3) s.push(`Latih lagi menunggu sampai hitungan lima: rata-rata jeda ${koma(jeda)} detik.`);
  const t = input.tren.filter((x) => x.jeda_rata_s !== null);
  if (t.length >= 2 && t.at(-1)!.jeda_rata_s! - t[0].jeda_rata_s! >= 1) {
    s.push(`Jeda menunggu naik dari ${koma(t[0].jeda_rata_s!)} ke ${koma(t.at(-1)!.jeda_rata_s!)} detik; pertimbangkan menambah strategi perluasan.`);
  }
  const suruhan = input.rekaman.reduce((n, r) => n + (r.hasil?.ukuran?.suruhan_beruntun ?? 0), 0);
  if (suruhan >= 2) s.push(`Ada ${suruhan} suruhan "ayo bilang" beruntun dalam 14 hari; bahas pengganti yang lebih ringan.`);
  for (const a of input.anggota) {
    if (a.izin_nilai && !input.rekaman.some((r) => r.anggota_id === a.id && r.status === "dinilai")) s.push(`${a.nama} belum punya rekaman yang dinilai dalam 14 hari.`);
  }
  if (!input.strategi.data_cukup) s.push(`Data rekaman belum cukup untuk angka strategi (perlu ${SYARAT_REKAMAN} rekaman dan ${SYARAT_AJAKAN} ajakan).`);
  return s.slice(0, 5);
}

export { awalHariWib };
