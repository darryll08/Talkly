// Penyedia data contoh untuk NEXT_PUBLIC_PAKAI_CONTOH=1, dari lib/kontrak/contoh/.
// Sedikit keadaan disimpan selama sesi peramban (aktivitas selesai, pesan, izin, persona demo) agar alur bisa dicoba
// tanpa server. Rekaman ID.rekamanDitolak = ditolak; ID lain = lolos. Kode undangan berawalan LAMA = kedaluwarsa,
// DIPAKAI = sudah dipakai, SRI = untuk pengasuh. Kode masuk berisi SALAH = 401.

import { API, type NamaEndpoint, type ResponseDari } from "@/lib/kontrak/api";
import { CONTOH } from "@/lib/kontrak/contoh";
import { ID, VARIAN_ORTU, AKTIVITAS_CONTOH } from "@/lib/kontrak/contoh/ortu";
import { pasangContoh, GalatApi, type Endpoint } from "./panggil";

type Data = Record<string, unknown> | undefined;
const KUNCI_PERSONA = "talkly:contoh-persona";

/** Keluarga lain di klinik contoh: data Raka dipakai ulang dengan nama anak yang diganti (hanya mode data contoh). */
const KELUARGA_LAIN: Record<string, string> = { ibu_alya: "Alya", ibu_bima: "Bima", ibu_citra: "Citra" };

function persona(): string {
  try {
    return localStorage.getItem(KUNCI_PERSONA) ?? "ibu_sari";
  } catch {
    return "ibu_sari";
  }
}

function untukKeluargaLain(nama: NamaEndpoint, hasil: unknown): unknown {
  const anak = KELUARGA_LAIN[persona()];
  if (!anak || hasil === null || hasil === undefined) return hasil;
  if (nama === "kemajuan" && anak !== "Alya") hasil = VARIAN_ORTU.kemajuanBelumCukup;
  let teks = JSON.stringify(hasil).replaceAll("Ibu Sari", `Ibu ${anak}`).replaceAll("Raka", anak);
  if (nama === "hariIni" && anak === "Bima") teks = teks.replaceAll('"selesai_hari_ini":true', '"selesai_hari_ini":false');
  return JSON.parse(teks);
}

const salin = <T>(x: T): T => structuredClone(x);
const selesai = new Set<string>();
const pesanTambahan: ResponseDari<"pesanLihat">["pesan"] = [];
let izin = salin(CONTOH.izinLihat!.izin);
const tanyaRekaman = new Map<string, number>();

function galat(status: number, pesan: string): never {
  throw new GalatApi(status, pesan);
}

const PENANGAN: { [N in NamaEndpoint]?: (d: Data) => unknown } = {
  saya: () => {
    if (persona() === "mbak_sri") return VARIAN_ORTU.sayaSri;
    return { ...CONTOH.saya!, anggota: { ...CONTOH.saya!.anggota, ...izin } };
  },
  izinLihat: () => ({ ...CONTOH.izinLihat!, izin }),
  izinUbah: (d) => {
    const dihapus = izin.izin_dengar && d?.izin_dengar === false ? 2 : 0;
    izin = { ...izin, ...(d as Partial<typeof izin>) };
    return { izin, audio_dihapus: dihapus };
  },
  undanganLihat: (d) => {
    const kode = String(d?.kode ?? "").toUpperCase();
    if (kode.startsWith("LAMA")) return { ...CONTOH.undanganLihat!, status: "kedaluwarsa" };
    if (kode.startsWith("DIPAKAI")) return { ...CONTOH.undanganLihat!, status: "dipakai" };
    if (kode.startsWith("SRI")) return { ...CONTOH.undanganLihat!, peran: "pengasuh" };
    return CONTOH.undanganLihat;
  },
  masuk: (d) => (String(d?.kode_masuk).toUpperCase().includes("SALAH") ? galat(401, "Kode masuk salah") : null),
  hariIni: () => {
    const dasar = salin(persona() === "mbak_sri" ? VARIAN_ORTU.hariIniSri : CONTOH.hariIni!);
    dasar.anggota = { ...dasar.anggota, ...(persona() === "ibu_sari" ? izin : {}) };
    dasar.aktivitas = dasar.aktivitas.map((a) => ({ ...a, selesai_hari_ini: a.selesai_hari_ini || selesai.has(a.item_id) }));
    return dasar;
  },
  aktivitasLihat: (d) => {
    const a = AKTIVITAS_CONTOH[String(d?.itemId) as keyof typeof AKTIVITAS_CONTOH];
    if (!a) galat(404, "Aktivitas tidak ditemukan");
    const sudah = selesai.has(a.item_id) || (persona() === "ibu_sari" && a.item_id === ID.itemMakan);
    return { ...salin(a), selesai_hari_ini: sudah };
  },
  aktivitasSelesai: (d) => {
    selesai.add(String(d?.itemId));
    return null;
  },
  rekamanLihat: (d) => {
    const id = String(d?.id);
    const n = (tanyaRekaman.get(id) ?? 0) + 1;
    tanyaRekaman.set(id, n);
    const akhir = id === ID.rekamanDitolak ? VARIAN_ORTU.rekamanDitolak : CONTOH.rekamanLihat!;
    if (n < 3) return { ...akhir, id, status: "antre", alasan_tolak: null, hasil: null };
    return { ...akhir, id };
  },
  laporan: (d) => {
    const isi = (d as { jenis: string; isi: { regresi?: boolean; lebih_sedikit_bersuara?: boolean } }).isi;
    const naik = Boolean(isi?.regresi || isi?.lebih_sedikit_bersuara);
    return {
      ...CONTOH.laporan!,
      terapis_diberi_tahu: naik,
      pesan: naik ? "Kak Nadia sudah diberi tahu dan akan membahasnya di sesi Sabtu." : CONTOH.laporan!.pesan,
    };
  },
  kemajuan: () => (persona() === "mbak_sri" ? VARIAN_ORTU.kemajuanBelumCukup : CONTOH.kemajuan),
  keluargaMingguIni: () =>
    persona() === "mbak_sri"
      ? galat(403, "Hanya untuk pengelola keluarga")
      : CONTOH.keluargaMingguIni,
  pesanLihat: () => ({ pesan: [...CONTOH.pesanLihat!.pesan, ...pesanTambahan] }),
  pesanKirim: (d) => {
    const p = {
      id: crypto.randomUUID(),
      dari: "keluarga" as const,
      nama: persona() === "mbak_sri" ? "Mbak Sri" : "Ibu Sari",
      isi: String(d?.isi ?? ""),
      konteks: (d?.konteks as string | undefined) ?? null,
      dibuat: new Date().toISOString().replace("Z", "+00:00"),
    };
    pesanTambahan.push(p);
    return p;
  },
  kartuBenda: (d) => {
    const nama = String(d?.nama_benda ?? "").trim().toLowerCase();
    const kata = nama.split(/\s+/)[0];
    return { kata, contoh_kalimat: [`${kata}… mana?`, `${kata}… lagi!`] };
  },
  demo: (d) => {
    try {
      if (d?.sebagai === "ibu_sari" || d?.sebagai === "mbak_sri" || String(d?.sebagai) in KELUARGA_LAIN)
        localStorage.setItem(KUNCI_PERSONA, String(d!.sebagai));
    } catch {}
    return null;
  },
};

function namaDari(e: Endpoint): NamaEndpoint | undefined {
  return (Object.keys(API) as NamaEndpoint[]).find((n) => API[n].metode === e.metode && API[n].path === e.path);
}

export function pasang() {
  pasangContoh(async (e: Endpoint, data) => {
    const nama = namaDari(e);
    await new Promise((ok) => setTimeout(ok, 300));
    if (!nama) galat(404, `Endpoint ${e.metode} ${e.path} tidak ada di kontrak.`);
    const f = PENANGAN[nama];
    if (f) return untukKeluargaLain(nama, f(data));
    if (!("response" in API[nama])) return null;
    if (nama in CONTOH) return untukKeluargaLain(nama, salin(CONTOH[nama]));
    galat(404, `Belum ada data contoh untuk ${nama}.`);
  });
}
