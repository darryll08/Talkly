import type { Akses } from "@/lib/kontrak/api";
import { galat } from "./respons";
import { bacaSesi } from "./sesi";
import { db } from "./supabase";

// Penjaga akses semua route (K1). Tidak ada handler yang menyentuh data sebelum sesi dicek di sini.

export type AnggotaSesi = {
  id: string;
  anak_id: string;
  nama: string;
  peran: string;
  pengelola: boolean;
  izin_nilai: boolean;
  izin_dengar: boolean;
  izin_klip: boolean;
};
export type TerapisSesi = { id: string; klinik_id: string; nama: string };

export type Saya =
  | { jenis: "anggota"; anggota: AnggotaSesi }
  | { jenis: "terapis"; terapis: TerapisSesi }
  | { jenis: "cron" }
  | { jenis: "publik" };

type KonteksRoute = { params: Promise<Record<string, string>> };
type Handler<S extends Saya> = (req: Request, ctx: { saya: S; params: Record<string, string> }) => Promise<Response>;

type SayaUntuk<P extends Akses> =
  | (P extends "anggota" | "pengelola" ? Extract<Saya, { jenis: "anggota" }> : never)
  | (P extends "terapis" ? Extract<Saya, { jenis: "terapis" }> : never)
  | (P extends "cron" ? Extract<Saya, { jenis: "cron" }> : never)
  | (P extends "publik" ? Saya : never);

async function muatAnggota(): Promise<AnggotaSesi | null> {
  const id = await bacaSesi("anggota");
  if (!id) return null;
  const { data } = await db()
    .from("anggota")
    .select("id, anak_id, nama, peran, pengelola_keluarga, izin_nilai, izin_dengar, izin_klip")
    .eq("id", id)
    .eq("aktif", true)
    .maybeSingle();
  if (!data) return null;
  const { pengelola_keluarga, ...sisa } = data;
  return { ...sisa, pengelola: pengelola_keluarga } as AnggotaSesi;
}

async function muatTerapis(): Promise<TerapisSesi | null> {
  const id = await bacaSesi("terapis");
  if (!id) return null;
  const { data } = await db().from("terapis").select("id, klinik_id, nama").eq("id", id).maybeSingle();
  return (data as TerapisSesi | null) ?? null;
}

function cronSah(req: Request): boolean {
  const rahasia = process.env.CRON_SECRET;
  return !!rahasia && req.headers.get("authorization") === `Bearer ${rahasia}`;
}

/**
 * Bungkus handler route. Peran dicoba berurutan; yang pertama cocok dipakai.
 * "pengelola" = anggota dengan pengelola_keluarga. Tanpa sesi yang cocok → 401.
 */
export function denganAkses<const P extends Akses>(peran: readonly P[], handler: Handler<SayaUntuk<P>>) {
  return async (req: Request, ctx: KonteksRoute): Promise<Response> => {
    const params = (await ctx?.params) ?? {};
    let saya: Saya | null = null;

    if (peran.includes("cron" as P) && cronSah(req)) saya = { jenis: "cron" };
    if (!saya && (peran.includes("anggota" as P) || peran.includes("pengelola" as P))) {
      const a = await muatAnggota();
      if (a && (peran.includes("anggota" as P) || a.pengelola)) saya = { jenis: "anggota", anggota: a };
    }
    if (!saya && peran.includes("terapis" as P)) {
      const t = await muatTerapis();
      if (t) saya = { jenis: "terapis", terapis: t };
    }
    if (!saya && peran.includes("publik" as P)) saya = { jenis: "publik" };

    if (!saya) return galat(401, "Silakan masuk dulu.");
    try {
      return await handler(req, { saya: saya as SayaUntuk<P>, params });
    } catch (e) {
      console.error(`${req.method} ${new URL(req.url).pathname}`, e);
      return galat(500, "Ada yang belum berjalan. Coba lagi sebentar lagi.");
    }
  };
}

/** 403 bila terapis bukan penangan anak itu, 404 bila anak tidak ada. null = boleh lanjut. */
export async function cekTerapisMenangani(terapisId: string, anakId: string): Promise<Response | null> {
  const { data } = await db().from("anak").select("terapis_id").eq("id", anakId).maybeSingle();
  if (!data) return galat(404, "Data anak tidak ditemukan.");
  if (data.terapis_id !== terapisId) return galat(403, "Anak ini bukan dalam penanganan Anda.");
  return null;
}

/**
 * Kueri tabel keluarga yang selalu difilter anak_id milik sesi, di database (K2).
 * Pakai ini, bukan db().from(...), untuk semua data keluarga.
 */
export function dbKeluarga(anggota: AnggotaSesi) {
  const anakId = anggota.anak_id;
  return {
    anakId,
    pilih: (tabel: string, kolom = "*") => db().from(tabel).select(kolom).eq("anak_id", anakId),
    ubah: (tabel: string, nilai: Record<string, unknown>) => db().from(tabel).update(nilai).eq("anak_id", anakId),
    hapus: (tabel: string) => db().from(tabel).delete().eq("anak_id", anakId),
    tambah: (tabel: string, baris: Record<string, unknown> | Record<string, unknown>[]) =>
      db()
        .from(tabel)
        .insert(Array.isArray(baris) ? baris.map((b) => ({ ...b, anak_id: anakId })) : { ...baris, anak_id: anakId }),
  };
}
