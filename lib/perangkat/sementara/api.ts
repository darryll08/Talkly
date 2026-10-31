// KONTRAK SEMENTARA untuk layar orang tua, disusun dari tabel endpoint di prompt bagian 2.
// Dipakai sampai lib/kontrak/api.ts dari Darryl ter-push; setelah itu impor layar diganti ke @/lib/kontrak/api
// dan file ini dihapus. Jangan dipakai sebagai acuan server.

import { z } from "zod";
import type { Endpoint } from "../panggil";

const ep = <E extends Endpoint>(e: E) => e;

export const Peran = z.enum(["ibu", "ayah", "pengasuh", "nenek", "kakek", "lainnya"]);
export type Peran = z.infer<typeof Peran>;

export const Anggota = z.object({
  id: z.string(),
  nama: z.string(),
  peran: Peran,
  pengelola: z.boolean(),
  izin_nilai: z.boolean(),
  izin_dengar: z.boolean(),
  izin_klip: z.boolean(),
});

export const Anak = z.object({
  id: z.string(),
  nama: z.string(),
  tahap: z.number().int().min(1).max(4),
  kata_target: z.array(z.string()),
  terapis: z.object({ nama: z.string() }),
  klinik: z.object({ nama: z.string() }).optional(),
});

const Izin = z.object({ izin_nilai: z.boolean(), izin_dengar: z.boolean(), izin_klip: z.boolean() });

export const PenjelasanIzin = z.object({
  kunci: z.enum(["izin_nilai", "izin_dengar", "izin_klip"]),
  judul: z.string(),
  isi: z.string(),
  penyedia: z.string(),
  negara: z.string(),
  wajib_untuk: z.string(),
});

const ResponsIzin = z.object({
  izin: Izin,
  penjelasan: z.array(PenjelasanIzin),
  dasar_hukum: z.string(),
  audio_dihapus: z.number().int().optional(),
});

// ---------- hasil.ts ----------
export const Ajakan = z.object({
  t_mulai: z.number(),
  t_selesai: z.number(),
  teks: z.string(),
  kategori: z.enum(["anak_merespons", "menunggu_cukup", "memotong"]),
  jeda_s: z.number(),
});

export const Hasil = z.object({
  rekaman_id: z.string(),
  mutu: z.object({
    lolos: z.boolean(),
    alasan: z.string().nullable(),
    durasi_s: z.number(),
    kata_perekam: z.number(),
  }),
  stt: z.object({
    penyedia: z.enum(["scribe", "deepgram", "tidak_ada"]),
    sumber_suara_anak: z.enum(["label", "celah_hening", "tidak_ada"]),
  }),
  ajakan: z.array(Ajakan),
  ukuran: z.object({
    jumlah_ajakan: z.number(),
    ajakan_berhasil: z.number(),
    memotong: z.number(),
    jeda_rata_s: z.number(),
    giliran: z.number(),
    vokalisasi_anak: z.number(),
    ucapan_kata_target: z.number(),
    pertanyaan_beruntun: z.number(),
    suruhan_beruntun: z.number(),
    perluasan_ai: z.number(),
  }),
  umpan_balik: z.object({
    pujian_id: z.string(),
    saran_id: z.string(),
    teks_pujian: z.string(),
    teks_saran: z.string(),
    kutipan: z.string(),
    versi_anak: z.string(),
    momen: z.object({ t_mulai: z.number(), t_selesai: z.number() }).nullable(),
    sumber: z.enum(["ai", "cadangan"]),
  }),
  laporan_terapis: z.string(),
  naikkan_status: z.boolean(),
});
export type Hasil = z.infer<typeof Hasil>;

export const StatusRekaman = z.object({
  status: z.enum(["antre", "dinilai", "ditolak"]),
  alasan_tolak: z.string().nullable(),
  durasi_s: z.number().nullable(),
  rekaman_contoh: z.boolean(),
  hasil: Hasil.nullable(),
});
export type StatusRekaman = z.infer<typeof StatusRekaman>;

// ---------- laporan.ts ----------
export const Laporan = z.discriminatedUnion("jenis", [
  z.object({
    jenis: z.literal("catatan_malam"),
    isi: z.object({
      kata: z.array(z.string()),
      dibanding_biasanya: z.enum(["sama", "lebih_banyak", "lebih_sedikit"]).nullable(),
      kondisi: z.enum(["sehat", "demam", "rewel", "sakit", "lainnya"]).nullable(),
      regresi: z.boolean(),
      berbeda: z.string(),
      pesan_terapis: z.string(),
    }),
  }),
  z.object({
    jenis: z.literal("ceritakan_sendiri"),
    isi: z.object({
      aktivitas: z.string(),
      sempat_menunggu: z.string(),
      yang_dilakukan_anak: z.string(),
      pesan_terapis: z.string(),
      rekaman_id: z.string().nullable(),
    }),
  }),
]);
export type Laporan = z.infer<typeof Laporan>;

// ---------- endpoint ----------
export const api = {
  saya: ep({ metode: "GET", path: "/api/saya", response: z.object({ anggota: Anggota, anak: Anak }) }),
  keluar: ep({ metode: "DELETE", path: "/api/saya" }),
  izin: ep({ metode: "GET", path: "/api/saya/izin", response: ResponsIzin }),
  ubahIzin: ep({ metode: "PATCH", path: "/api/saya/izin", request: Izin.partial(), response: ResponsIzin }),
  kodeMasukBaru: ep({ metode: "POST", path: "/api/saya/kode-masuk", response: z.object({ kode_masuk: z.string() }) }),

  cekUndangan: ep({
    metode: "GET",
    path: "/api/undangan/:kode",
    request: z.object({ kode: z.string().min(4) }),
    response: z.object({
      status: z.enum(["menunggu", "dipakai", "kedaluwarsa"]),
      peran: Peran,
      anak: z.object({ nama: z.string() }),
      klinik: z.object({ nama: z.string() }),
      terapis: z.object({ nama: z.string() }),
      diundang_oleh: z.string().nullable(),
    }),
  }),
  gabung: ep({
    metode: "POST",
    path: "/api/gabung",
    request: z.object({ kode: z.string(), nama: z.string().min(1).max(40) }),
    response: z.object({ kode_masuk: z.string() }),
  }),
  masuk: ep({ metode: "POST", path: "/api/masuk", request: z.object({ kode_masuk: z.string().min(4) }) }),
  buatUndangan: ep({
    metode: "POST",
    path: "/api/undangan",
    request: z.object({ anak_id: z.string(), peran: Peran }),
    response: z.object({ kode: z.string(), tautan: z.string(), kedaluwarsa: z.string() }),
  }),
  cabutAnggota: ep({ metode: "DELETE", path: "/api/anggota/:id", request: z.object({ id: z.string() }) }),

  hariIni: ep({
    metode: "GET",
    path: "/api/hari-ini",
    response: z.object({
      anggota: Anggota,
      anak: Anak,
      terapis: z.object({ nama: z.string() }),
      rencana: z.object({ pesan_keluarga: z.string(), baru: z.boolean() }).nullable(),
      aktivitas: z.array(
        z.object({
          item_id: z.string(),
          judul: z.string(),
          rutinitas: z.string(),
          kata_target: z.array(z.string()),
          selesai_hari_ini: z.boolean(),
        }),
      ),
      hari_aktif_minggu_ini: z.number().int(),
      kabar_keluarga: z.array(z.object({ nama: z.string(), isi: z.string(), waktu: z.string() })),
    }),
  }),
  aktivitas: ep({
    metode: "GET",
    path: "/api/aktivitas/:itemId",
    request: z.object({ itemId: z.string() }),
    response: z.object({
      judul: z.string(),
      rutinitas: z.string(),
      kata_target: z.array(z.string()),
      langkah: z.array(z.string()),
      bila_mencoba: z.string(),
      bila_belum: z.string(),
      selesai_hari_ini: z.boolean().optional(),
    }),
  }),
  tandaiAktivitas: ep({ metode: "POST", path: "/api/aktivitas/:itemId", request: z.object({ itemId: z.string() }) }),

  rekaman: ep({ metode: "GET", path: "/api/rekaman/:id", request: z.object({ id: z.string() }), response: StatusRekaman }),
  kurangTepat: ep({ metode: "POST", path: "/api/rekaman/:id/kurang-tepat", request: z.object({ id: z.string() }) }),

  laporan: ep({
    metode: "POST",
    path: "/api/laporan",
    request: Laporan,
    response: z.object({ pesan: z.string(), terapis_diberi_tahu: z.boolean() }),
  }),

  kemajuan: ep({
    metode: "GET",
    path: "/api/kemajuan",
    response: z.object({
      anak: z.object({ nama: z.string() }),
      strategi: z.object({
        jeda_rata_s: z.number().nullable(),
        giliran_per_menit: z.number().nullable(),
        data_cukup: z.boolean(),
        rekaman: z.number().int(),
        ajakan: z.number().int(),
      }),
      tren: z.array(
        z.object({ minggu_mulai: z.string(), jeda_rata_s: z.number().nullable(), giliran_per_menit: z.number().nullable() }),
      ),
      kata_anak: z.array(z.object({ kata: z.string(), sejak: z.string(), sumber: z.enum(["dilaporkan", "dikonfirmasi"]) })),
    }),
  }),

  keluargaMingguIni: ep({
    metode: "GET",
    path: "/api/keluarga-minggu-ini",
    response: z.object({
      minggu_mulai: z.string(),
      anggota: z.array(
        z.object({
          id: z.string(),
          nama: z.string(),
          peran: Peran,
          saya: z.boolean(),
          pengelola: z.boolean(),
          izin_nilai: z.boolean(),
          hari_aktif: z.array(z.boolean()).length(7),
          aktivitas: z.array(z.string()),
          kalimat: z.string(),
        }),
      ),
    }),
  }),

  pesan: ep({
    metode: "GET",
    path: "/api/pesan",
    response: z.object({
      terapis: z.object({ nama: z.string() }),
      pesan: z.array(
        z.object({
          id: z.string(),
          dari: z.enum(["saya", "keluarga", "terapis"]),
          nama: z.string(),
          isi: z.string(),
          konteks: z.string().nullable(),
          dibuat: z.string(),
        }),
      ),
    }),
  }),
  kirimPesan: ep({
    metode: "POST",
    path: "/api/pesan",
    request: z.object({ isi: z.string().min(1).max(1000), konteks: z.string().optional() }),
    response: z.object({ id: z.string() }),
  }),

  kartuBenda: ep({
    metode: "POST",
    path: "/api/kartu-benda",
    request: z.object({ nama_benda: z.string().min(1).max(40) }),
    response: z.object({ kata: z.string(), contoh_kalimat: z.array(z.string()) }),
  }),
  push: ep({
    metode: "POST",
    path: "/api/push",
    request: z.object({
      endpoint: z.string(),
      expirationTime: z.number().nullable().optional(),
      keys: z.object({ p256dh: z.string(), auth: z.string() }),
    }),
  }),

  demo: ep({
    metode: "POST",
    path: "/api/demo",
    request: z.object({ sebagai: z.enum(["ibu_sari", "mbak_sri", "kak_nadia"]) }),
  }),
  tesSambungan: ep({
    metode: "GET",
    path: "/api/tes-sambungan",
    response: z.object({ layanan: z.array(z.object({ nama: z.string(), ok: z.boolean(), catatan: z.string().nullable() })) }),
  }),
} as const;
