import type { AnggotaSesi } from "@/lib/server/akses";
import { db } from "@/lib/server/supabase";
import { awalHariWib, seninWib, tanggalWib } from "@/lib/server/waktu";

// Rencana aktif dan aktivitas keluarga (O3, O4). Semua kueri dibatasi anak_id milik sesi.

/** Kata target yang paling cocok untuk satu aktivitas: yang sudah disebut di teksnya, atau yang lazim di rutinitasnya. */
const KATA_RUTINITAS: Record<string, string[]> = {
  mandi: ["bebek", "air", "mandi", "lagi", "gosok", "buka", "busa", "handuk"],
  makan: ["mamam", "makan", "mau", "lagi", "minum", "susu", "habis", "buka", "tiup", "sendok"],
  bermain: ["lagi", "mau", "jalan", "bola", "mobil", "buka", "tiup", "ayun", "masuk", "kereta"],
  berpakaian: ["pakai", "baju", "kaki", "buka", "sepatu", "tangan", "jaket"],
  berbelanja: ["masuk", "mau", "beli", "jalan"],
  tidur: ["bobok", "tidur", "lampu", "mati", "selimut", "kaki"],
};

export function kataUntuk(teksAktivitas: string, rutinitas: string, kataTarget: string[]): string[] {
  const teks = teksAktivitas.toLowerCase();
  const disebut = kataTarget.filter((k) => teks.includes(k.toLowerCase()));
  const lazim = kataTarget.filter((k) => (KATA_RUTINITAS[rutinitas] ?? []).includes(k.toLowerCase()));
  const urut = [...new Set([...disebut, ...lazim, ...kataTarget])];
  return urut.slice(0, 2);
}

export function isiKata<T extends string | string[]>(teks: T, kata: string): T {
  const ganti = (s: string) => s.replaceAll("{kata}", kata);
  return (Array.isArray(teks) ? teks.map(ganti) : ganti(teks)) as T;
}

export type RencanaAktif = { id: string; pesan_keluarga: string; minggu_mulai: string; disetujui_pada: string | null };

/** Rencana disetujui yang berlaku: minggu terbaru, lalu yang paling akhir disetujui. */
export async function rencanaAktif(anakId: string): Promise<RencanaAktif | null> {
  const { data } = await db()
    .from("rencana")
    .select("id, pesan_keluarga, minggu_mulai, disetujui_pada")
    .eq("anak_id", anakId)
    .eq("disetujui", true)
    .lte("minggu_mulai", tanggalWib())
    .order("minggu_mulai", { ascending: false })
    .order("disetujui_pada", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return (data as RencanaAktif | null) ?? null;
}

/** Hari dengan kegiatan (log aktivitas, rekaman, atau laporan) milik satu anggota sejak tanggal tertentu. */
export async function hariAktif(anggotaId: string, sejak: string): Promise<Set<string>> {
  const awal = awalHariWib(sejak);
  const [log, rek, lap] = await Promise.all([
    db().from("log_aktivitas").select("tanggal").eq("anggota_id", anggotaId).gte("tanggal", sejak),
    db().from("rekaman").select("dibuat").eq("anggota_id", anggotaId).gte("dibuat", awal),
    db().from("laporan_keluarga").select("tanggal").eq("anggota_id", anggotaId).gte("tanggal", sejak),
  ]);
  const hari = new Set<string>();
  for (const r of log.data ?? []) hari.add(r.tanggal as string);
  for (const r of lap.data ?? []) hari.add(r.tanggal as string);
  for (const r of rek.data ?? []) hari.add(tanggalWib(0, new Date(r.dibuat as string)));
  return hari;
}

export type ItemAktivitas = {
  item_id: string;
  aktivitas_id: string;
  anggota_id: string | null;
  judul: string;
  rutinitas: string;
  langkah: string[];
  bila_mencoba: string;
  bila_belum: string;
};

/** Item rencana untuk anggota ini (miliknya sendiri atau untuk semua). */
export async function itemRencana(rencanaId: string, anggota: AnggotaSesi | null): Promise<ItemAktivitas[]> {
  let q = db()
    .from("rencana_item")
    .select("id, anggota_id, aktivitas_id, urutan, aktivitas:aktivitas_id (judul, rutinitas, langkah, bila_mencoba, bila_belum)")
    .eq("rencana_id", rencanaId)
    .order("urutan");
  if (anggota) q = q.or(`anggota_id.is.null,anggota_id.eq.${anggota.id}`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => {
    const a = (Array.isArray(r.aktivitas) ? r.aktivitas[0] : r.aktivitas) as Omit<ItemAktivitas, "item_id" | "aktivitas_id" | "anggota_id">;
    return { item_id: r.id, aktivitas_id: r.aktivitas_id, anggota_id: r.anggota_id, ...a };
  });
}

export { seninWib, tanggalWib };
