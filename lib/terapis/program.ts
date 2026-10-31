import aktivitasJson from "@/data/aktivitas.json";
import { BankAktivitas } from "@/lib/kontrak/konten";
import { db } from "@/lib/server/supabase";
import { awalHariWib, tanggalWib } from "@/lib/server/waktu";

// Bantuan dasbor terapis: bank aktivitas, program anak, dan hari aktif banyak anak sekaligus (tanpa N+1).

export const BANK = BankAktivitas.parse(aktivitasJson);
export const ID_BANK = new Set(BANK.map((a) => a.id));

export function usiaBulan(tanggalLahir: string) {
  const l = new Date(tanggalLahir);
  const n = new Date();
  return (n.getFullYear() - l.getFullYear()) * 12 + n.getMonth() - l.getMonth() - (n.getDate() < l.getDate() ? 1 : 0);
}

/** Jumlah hari aktif 7 hari terakhir per anak (log aktivitas, rekaman, laporan). */
export async function hariAktifPerAnak(anakIds: string[]): Promise<Map<string, number>> {
  const hasil = new Map(anakIds.map((id) => [id, new Set<string>()]));
  if (anakIds.length === 0) return new Map();
  const sejak = tanggalWib(6);
  const [log, rek, lap] = await Promise.all([
    db().from("log_aktivitas").select("tanggal, anggota:anggota_id!inner (anak_id)").in("anggota.anak_id", anakIds).gte("tanggal", sejak),
    db().from("rekaman").select("anak_id, dibuat").in("anak_id", anakIds).gte("dibuat", awalHariWib(sejak)),
    db().from("laporan_keluarga").select("anak_id, tanggal").in("anak_id", anakIds).gte("tanggal", sejak),
  ]);
  for (const r of log.data ?? []) {
    const a = (Array.isArray(r.anggota) ? r.anggota[0] : r.anggota) as { anak_id: string };
    hasil.get(a.anak_id)?.add(r.tanggal as string);
  }
  for (const r of rek.data ?? []) hasil.get(r.anak_id)?.add(tanggalWib(0, new Date(r.dibuat)));
  for (const r of lap.data ?? []) hasil.get(r.anak_id)?.add(r.tanggal as string);
  return new Map([...hasil].map(([k, v]) => [k, v.size]));
}

/** Aktivitas pada rencana terbaru anak (untuk D1 dan draf rencana). */
export async function aktivitasRencanaTerbaru(anakId: string): Promise<{ rencana_id: string | null; item: { aktivitas_id: string; anggota_id: string | null; urutan: number }[] }> {
  const { data: r } = await db()
    .from("rencana")
    .select("id, rencana_item (aktivitas_id, anggota_id, urutan)")
    .eq("anak_id", anakId)
    .eq("disetujui", true)
    .order("minggu_mulai", { ascending: false })
    .order("disetujui_pada", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  const item = ((r?.rencana_item ?? []) as { aktivitas_id: string; anggota_id: string | null; urutan: number }[]).sort((a, b) => a.urutan - b.urutan);
  return { rencana_id: r?.id ?? null, item };
}
