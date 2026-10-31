import { z } from "zod";
import { HasilRekaman } from "./hasil";
import { Laporan } from "./laporan";

// Kontrak 2.1: daftar semua endpoint Talkly. Layar B dan C hanya memanggil endpoint di sini lewat panggil().
// Parameter path (`:id`) ikut di skema request; panggil() memindahkannya ke URL, sisanya jadi query (GET/DELETE) atau body.
// Kode layar mengikuti v19: D5 = Setelah sesi, D6 = Pesan keluarga.

export type Akses = "publik" | "anggota" | "pengelola" | "terapis" | "admin" | "cron";
export type Titik = "I0" | "I1" | "I2" | "I3";

export type DefEndpoint = {
  metode: "GET" | "POST" | "PATCH" | "DELETE";
  path: `/api/${string}`;
  akses: readonly Akses[];
  request?: z.ZodType;
  response?: z.ZodType; // tidak ada = 204
  /** Kode galat selain 401/403 dan artinya. */
  galat?: Readonly<Record<number, string>>;
  layar: readonly string[];
  titik: Titik;
  /** Body multipart, bukan JSON (hanya unggah rekaman). */
  multipart?: true;
};

// ---------- Nilai bersama ----------

export const Peran = z.enum(["ibu", "ayah", "pengasuh", "nenek", "kakek", "lainnya"]);
export type Peran = z.infer<typeof Peran>;

export const StatusAnak = z.enum(["lanjut", "terapis_meninjau", "bahas_minggu_ini"]);
export type StatusAnak = z.infer<typeof StatusAnak>;

export const Tahap = z.number().int().min(1).max(4);
export const Id = z.uuid();
const Tanggal = z.iso.date();
const Waktu = z.iso.datetime({ offset: true });

export const Izin = z.object({
  izin_nilai: z.boolean(),
  izin_dengar: z.boolean(),
  izin_klip: z.boolean(),
});
export type Izin = z.infer<typeof Izin>;

const Terapis = z.object({ id: Id, nama: z.string() });
const AnggotaSaya = Izin.extend({
  id: Id,
  nama: z.string(),
  peran: Peran,
  pengelola: z.boolean(),
});
const AnakRingkas = z.object({
  id: Id,
  nama: z.string(),
  tahap: Tahap,
  kata_target: z.array(z.string()),
  terapis: Terapis,
});

const Pesan = z.object({
  id: Id,
  dari: z.enum(["keluarga", "terapis"]),
  nama: z.string(),
  isi: z.string(),
  konteks: z.string().nullable(),
  dibuat: Waktu,
});

const ItemRencana = z.object({
  aktivitas_id: z.string(),
  /** null = untuk semua anggota. */
  anggota_id: Id.nullable(),
  urutan: z.number().int(),
});
const IsiRencana = z.object({
  item: z.array(ItemRencana).min(1).max(12),
  pesan_keluarga: z.string().max(500),
  kata_target: z.array(z.string()).length(5).optional(),
});

const Draf = z.object({
  id: Id,
  isi: IsiRencana,
  /** Alasan setiap pilihan AI, tampil di sisi kanan D5. */
  dasar: z.array(z.object({ aktivitas_id: z.string(), alasan: z.string() })),
  status: z.enum(["aktif", "disetujui", "diganti"]),
  sumber: z.enum(["ai", "cadangan"]),
  dibuat: Waktu,
});

const Rentang = z.object({ nilai: z.number().nullable(), bawah: z.number().nullable(), atas: z.number().nullable() });

const Strategi = z.object({
  data_cukup: z.boolean(),
  rekaman: z.number().int(),
  ajakan: z.number().int(),
  jeda_rata_s: Rentang,
  giliran_per_menit: Rentang,
  ajakan_berhasil_persen: Rentang,
  vokalisasi_per_menit: Rentang,
});

const TrenMinggu = z.object({
  minggu_mulai: Tanggal,
  jeda_rata_s: z.number().nullable(),
  giliran_per_menit: z.number().nullable(),
  vokalisasi_per_minggu: z.number().int(),
  rekaman: z.number().int(),
});

const DataAnak = z.object({
  nama: z.string().trim().min(1).max(60),
  tanggal_lahir: Tanggal,
  pendengaran: z.enum(["normal", "belum_diperiksa", "gangguan"]).nullable(),
  tahap: Tahap,
  strategi_fokus: z.string().max(200),
  kata_target: z.array(z.string().trim().min(1).max(30)).length(5),
  aktivitas_id: z.array(z.string()).min(1).max(12),
  ukuran_nonaktif: z.array(z.enum(["suruhan_beruntun"])).default([]),
  minat: z.string().max(200).default(""),
  rutinitas: z.string().max(200).default(""),
  hari_sesi: z.number().int().min(1).max(7),
  jam_sesi: z.string().regex(/^\d{2}:\d{2}$/),
});

// ---------- Endpoint ----------

function ep<const D extends DefEndpoint>(d: D): D {
  return d;
}

export const API = {
  // Keluarga
  undanganLihat: ep({
    metode: "GET",
    path: "/api/undangan/:kode",
    akses: ["publik"],
    request: z.object({ kode: z.string().min(4).max(16) }),
    response: z.object({
      status: z.enum(["menunggu", "dipakai", "kedaluwarsa"]),
      peran: Peran,
      anak: z.object({ nama: z.string() }),
      klinik: z.object({ nama: z.string() }),
      terapis: z.object({ nama: z.string() }),
    }),
    galat: { 404: "Kode tidak ditemukan" },
    layar: ["O1", "O1b"],
    titik: "I2",
  }),
  gabung: ep({
    metode: "POST",
    path: "/api/gabung",
    akses: ["publik"],
    request: z.object({ kode: z.string().min(4).max(16), nama: z.string().trim().min(1).max(40) }),
    response: z.object({ kode_masuk: z.string(), anggota_id: Id }),
    galat: { 404: "Kode tidak ditemukan", 409: "Kode sudah dipakai atau anggota sudah 4", 410: "Kode kedaluwarsa" },
    layar: ["O1", "O1b", "O2c"],
    titik: "I2",
  }),
  masuk: ep({
    metode: "POST",
    path: "/api/masuk",
    akses: ["publik"],
    request: z.object({ kode_masuk: z.string().min(6).max(20) }),
    galat: { 401: "Kode masuk salah", 423: "Terkunci 15 menit setelah 5 kali salah" },
    layar: ["O1c"],
    titik: "I3",
  }),
  saya: ep({
    metode: "GET",
    path: "/api/saya",
    akses: ["anggota"],
    response: z.object({ anggota: AnggotaSaya, anak: AnakRingkas }),
    layar: ["O2", "O3", "O4", "O5", "O6", "O8", "O9", "O10", "O11", "O12", "O12a", "O4b", "Pesan"],
    titik: "I1",
  }),
  keluar: ep({
    metode: "DELETE",
    path: "/api/saya",
    akses: ["anggota"],
    layar: ["O12"],
    titik: "I3",
  }),
  izinLihat: ep({
    metode: "GET",
    path: "/api/saya/izin",
    akses: ["anggota"],
    response: z.object({
      izin: Izin,
      penjelasan: z.array(
        z.object({
          kunci: z.enum(["izin_nilai", "izin_dengar", "izin_klip"]),
          judul: z.string(),
          isi: z.string(),
          penyedia: z.string(),
          negara: z.string(),
          wajib_untuk: z.string(),
        }),
      ),
      dasar_hukum: z.string(),
    }),
    layar: ["O2", "O12"],
    titik: "I3",
  }),
  izinUbah: ep({
    metode: "PATCH",
    path: "/api/saya/izin",
    akses: ["anggota"],
    request: Izin.partial(),
    response: z.object({ izin: Izin, audio_dihapus: z.number().int() }),
    layar: ["O2", "O12"],
    titik: "I3",
  }),
  kodeMasukBaru: ep({
    metode: "POST",
    path: "/api/saya/kode-masuk",
    akses: ["anggota"],
    response: z.object({ kode_masuk: z.string() }),
    layar: ["O12"],
    titik: "I3",
  }),
  undanganBuat: ep({
    metode: "POST",
    path: "/api/undangan",
    akses: ["terapis", "pengelola"],
    request: z.object({ anak_id: Id, peran: Peran }),
    response: z.object({ kode: z.string(), tautan: z.string(), kedaluwarsa: Waktu }),
    galat: { 409: "Pendengaran belum diisi, atau anggota sudah 4" },
    layar: ["D2", "O12a"],
    titik: "I2",
  }),
  anggotaHapus: ep({
    metode: "DELETE",
    path: "/api/anggota/:id",
    akses: ["pengelola", "anggota"],
    request: z.object({ id: Id }),
    galat: { 404: "Anggota tidak ditemukan" },
    layar: ["O12"],
    titik: "I3",
  }),
  hariIni: ep({
    metode: "GET",
    path: "/api/hari-ini",
    akses: ["anggota"],
    response: z.object({
      anggota: AnggotaSaya,
      anak: AnakRingkas,
      terapis: Terapis,
      rencana: z
        .object({ id: Id, pesan_keluarga: z.string(), baru: z.boolean(), minggu_mulai: Tanggal })
        .nullable(),
      aktivitas: z.array(
        z.object({
          item_id: Id,
          aktivitas_id: z.string(),
          judul: z.string(),
          rutinitas: z.string(),
          kata_target: z.array(z.string()),
          selesai_hari_ini: z.boolean(),
        }),
      ),
      hari_aktif_minggu_ini: z.number().int().min(0).max(7),
      kabar_keluarga: z.array(z.object({ nama: z.string(), kalimat: z.string() })),
    }),
    layar: ["O3"],
    titik: "I2",
  }),
  aktivitasLihat: ep({
    metode: "GET",
    path: "/api/aktivitas/:itemId",
    akses: ["anggota"],
    request: z.object({ itemId: Id }),
    response: z.object({
      item_id: Id,
      judul: z.string(),
      rutinitas: z.string(),
      kata_target: z.array(z.string()),
      langkah: z.array(z.string()).length(3),
      bila_mencoba: z.string(),
      bila_belum: z.string(),
      selesai_hari_ini: z.boolean(),
    }),
    galat: { 404: "Aktivitas tidak ditemukan" },
    layar: ["O4", "O5"],
    titik: "I2",
  }),
  aktivitasSelesai: ep({
    metode: "POST",
    path: "/api/aktivitas/:itemId",
    akses: ["anggota"],
    request: z.object({ itemId: Id }),
    galat: { 404: "Aktivitas tidak ditemukan" },
    layar: ["O4"],
    titik: "I2",
  }),
  rekamanUnggah: ep({
    metode: "POST",
    path: "/api/rekaman",
    akses: ["anggota"],
    multipart: true,
    response: z.object({ rekaman_id: Id }),
    galat: {
      400: "Meta tidak sesuai",
      413: "Berkas lebih dari 5 MB",
      415: "Bukan audio webm/ogg",
      422: "Perekam belum menyalakan izin penilaian",
    },
    layar: ["O5"],
    titik: "I1",
  }),
  rekamanLihat: ep({
    metode: "GET",
    path: "/api/rekaman/:id",
    akses: ["anggota"],
    request: z.object({ id: Id }),
    response: z.object({
      id: Id,
      status: z.enum(["antre", "dinilai", "ditolak"]),
      alasan_tolak: z.string().nullable(),
      durasi_s: z.number().nullable(),
      rekaman_contoh: z.boolean(),
      perekam: z.object({ id: Id, nama: z.string() }),
      hasil: HasilRekaman.nullable(),
    }),
    galat: { 404: "Rekaman tidak ditemukan" },
    layar: ["O5b", "O6", "O7"],
    titik: "I1",
  }),
  rekamanKurangTepat: ep({
    metode: "POST",
    path: "/api/rekaman/:id/kurang-tepat",
    akses: ["anggota"],
    request: z.object({ id: Id }),
    galat: { 404: "Rekaman tidak ditemukan" },
    layar: ["O6"],
    titik: "I2",
  }),
  laporan: ep({
    metode: "POST",
    path: "/api/laporan",
    akses: ["anggota"],
    request: Laporan,
    response: z.object({ id: Id, pesan: z.string(), terapis_diberi_tahu: z.boolean() }),
    layar: ["O8", "O9"],
    titik: "I2",
  }),
  kemajuan: ep({
    metode: "GET",
    path: "/api/kemajuan",
    akses: ["anggota"],
    response: z.object({
      anak: AnakRingkas,
      strategi: Strategi,
      tren: z.array(TrenMinggu),
      kata_anak: z.array(
        z.object({ kata: z.string(), sejak: Tanggal, sumber: z.enum(["dilaporkan_keluarga", "dikonfirmasi_terapis"]) }),
      ),
    }),
    layar: ["O10"],
    titik: "I2",
  }),
  keluargaMingguIni: ep({
    metode: "GET",
    path: "/api/keluarga-minggu-ini",
    akses: ["pengelola"],
    response: z.object({
      minggu_mulai: Tanggal,
      anggota: z.array(
        z.object({
          id: Id,
          nama: z.string(),
          peran: Peran,
          saya: z.boolean(),
          izin_nilai: z.boolean(),
          hari_aktif: z.number().int().min(0).max(7),
          aktivitas: z.array(z.object({ judul: z.string(), kali: z.number().int() })),
          kalimat: z.string(),
        }),
      ),
    }),
    layar: ["O11", "O5", "O12"],
    titik: "I3",
  }),
  pesanLihat: ep({
    metode: "GET",
    path: "/api/pesan",
    akses: ["anggota"],
    response: z.object({ pesan: z.array(Pesan) }),
    layar: ["Pesan"],
    titik: "I3",
  }),
  pesanKirim: ep({
    metode: "POST",
    path: "/api/pesan",
    akses: ["anggota"],
    request: z.object({ isi: z.string().trim().min(1).max(1000), konteks: z.string().max(100).optional() }),
    response: Pesan,
    layar: ["Pesan"],
    titik: "I3",
  }),
  kartuBenda: ep({
    metode: "POST",
    path: "/api/kartu-benda",
    akses: ["anggota"],
    request: z.object({ nama_benda: z.string().trim().min(1).max(40) }),
    response: z.object({ kata: z.string(), contoh_kalimat: z.array(z.string()).min(2).max(3) }),
    galat: { 422: "Nama benda kosong" },
    layar: ["O4b"],
    titik: "I3",
  }),
  pushDaftar: ep({
    metode: "POST",
    path: "/api/push",
    akses: ["anggota"],
    request: z.object({
      endpoint: z.url(),
      expirationTime: z.number().nullable().optional(),
      keys: z.object({ p256dh: z.string(), auth: z.string() }),
    }),
    layar: ["O00", "O2b", "O12"],
    titik: "I3",
  }),

  // Terapis
  terapisMasuk: ep({
    metode: "POST",
    path: "/api/terapis/masuk",
    akses: ["publik"],
    request: z.object({ email: z.email(), kata_sandi: z.string().min(6).max(100) }),
    galat: { 401: "Email atau kata sandi salah" },
    layar: ["Masuk terapis"],
    titik: "I1",
  }),
  mingguIni: ep({
    metode: "GET",
    path: "/api/minggu-ini",
    akses: ["terapis"],
    response: z.object({
      terapis: Terapis,
      ringkasan: z.object({
        total: z.number().int(),
        bahas: z.number().int(),
        meninjau: z.number().int(),
        lanjut: z.number().int(),
      }),
      hari: z.array(
        z.object({
          tanggal: Tanggal,
          nama_hari: z.string(),
          anak: z.array(
            z.object({
              id: Id,
              nama: z.string(),
              usia_bulan: z.number().int(),
              tahap: Tahap,
              status: StatusAnak,
              pemicu: z.string().nullable(),
              jam_sesi: z.string(),
              hari_aktif_7: z.number().int().min(0).max(7),
              data_contoh: z.boolean(),
            }),
          ),
        }),
      ),
    }),
    layar: ["D3"],
    titik: "I2",
  }),
  aktivitasBank: ep({
    metode: "GET",
    path: "/api/aktivitas-bank",
    akses: ["terapis"],
    response: z.object({
      aktivitas: z.array(z.object({ id: z.string(), judul: z.string(), rutinitas: z.string(), tahap: Tahap })),
    }),
    layar: ["D1", "D5"],
    titik: "I2",
  }),
  anakBuat: ep({
    metode: "POST",
    path: "/api/anak",
    akses: ["terapis"],
    request: DataAnak,
    response: z.object({ id: Id }),
    layar: ["D1"],
    titik: "I2",
  }),
  anakLihat: ep({
    metode: "GET",
    path: "/api/anak/:id",
    akses: ["terapis"],
    request: z.object({ id: Id }),
    response: DataAnak.extend({ id: Id, status: StatusAnak, data_contoh: z.boolean() }),
    galat: { 404: "Anak tidak ditemukan" },
    layar: ["D1"],
    titik: "I2",
  }),
  anakUbah: ep({
    metode: "PATCH",
    path: "/api/anak/:id",
    akses: ["terapis"],
    request: DataAnak.partial().extend({ id: Id }),
    response: z.object({ id: Id }),
    galat: { 404: "Anak tidak ditemukan" },
    layar: ["D1"],
    titik: "I2",
  }),
  anakUndangan: ep({
    metode: "GET",
    path: "/api/anak/:id/undangan",
    akses: ["terapis"],
    request: z.object({ id: Id }),
    response: z.object({
      undangan: z.array(
        z.object({
          id: Id,
          peran: Peran,
          status: z.enum(["menunggu", "dipakai", "kedaluwarsa"]),
          kedaluwarsa: Waktu,
          dipakai_oleh: z.string().nullable(),
        }),
      ),
    }),
    layar: ["D2"],
    titik: "I2",
  }),
  anakKartu: ep({
    metode: "GET",
    path: "/api/anak/:id/kartu",
    akses: ["terapis"],
    request: z.object({ id: Id }),
    response: z.object({
      anak: AnakRingkas.extend({
        usia_bulan: z.number().int(),
        status: StatusAnak,
        pemicu: z.string().nullable(),
        pendengaran: z.string().nullable(),
        data_contoh: z.boolean(),
      }),
      strategi: Strategi,
      tren: z.array(TrenMinggu),
      per_pengasuh: z.array(
        z.object({
          anggota_id: Id,
          nama: z.string(),
          peran: Peran,
          rekaman: z.number().int(),
          jeda_rata_s: z.number().nullable(),
          giliran_per_menit: z.number().nullable(),
          hari_aktif_7: z.number().int(),
        }),
      ),
      rekaman_terpilih: z
        .object({
          id: Id,
          dibuat: Waktu,
          perekam: z.string(),
          durasi_s: z.number(),
          ajakan: HasilRekaman.shape.ajakan,
          suara_anak: HasilRekaman.shape.suara_anak,
          ukuran: HasilRekaman.shape.ukuran,
          laporan_terapis: z.string().nullable(),
          bisa_didengar: z.boolean(),
        })
        .nullable(),
      rekaman_terbaru: z.array(
        z.object({
          id: Id,
          dibuat: Waktu,
          perekam: z.string(),
          status: z.enum(["antre", "dinilai", "ditolak"]),
          jeda_rata_s: z.number().nullable(),
          bisa_didengar: z.boolean(),
        }),
      ),
      laporan_keluarga: z.array(z.object({ id: Id, tanggal: Tanggal, nama: z.string(), laporan: Laporan })),
      kata_dilaporkan: z.array(z.object({ kata: z.string(), sejak: Tanggal })),
      kutipan_regresi: z.array(z.object({ tanggal: Tanggal, nama: z.string(), kutipan: z.string() })),
      saran_sesi: z.array(z.string()),
    }),
    galat: { 404: "Anak tidak ditemukan" },
    layar: ["D4"],
    titik: "I1",
  }),
  rekamanAudio: ep({
    metode: "GET",
    path: "/api/rekaman/:id/audio",
    akses: ["terapis"],
    request: z.object({ id: Id }),
    response: z.object({ url: z.url(), berlaku_s: z.number().int() }),
    galat: { 404: "Rekaman tidak ditemukan atau audio sudah dihapus" },
    layar: ["D4"],
    titik: "I3",
  }),
  anakPesanLihat: ep({
    metode: "GET",
    path: "/api/anak/:id/pesan",
    akses: ["terapis"],
    request: z.object({ id: Id }),
    response: z.object({ pesan: z.array(Pesan) }),
    layar: ["D6"],
    titik: "I3",
  }),
  anakPesanKirim: ep({
    metode: "POST",
    path: "/api/anak/:id/pesan",
    akses: ["terapis"],
    request: z.object({ id: Id, isi: z.string().trim().min(1).max(1000) }),
    response: Pesan,
    layar: ["D6"],
    titik: "I3",
  }),
  setelahSesiLihat: ep({
    metode: "GET",
    path: "/api/setelah-sesi",
    akses: ["terapis"],
    request: z.object({ anak: Id }),
    response: z.object({
      catatan: z
        .object({ id: Id, tanggal: Tanggal, isi: z.string(), kata_baru_dikonfirmasi: z.array(z.string()) })
        .nullable(),
      draf: Draf.nullable(),
    }),
    layar: ["D5"],
    titik: "I3",
  }),
  setelahSesiSimpan: ep({
    metode: "POST",
    path: "/api/setelah-sesi",
    akses: ["terapis"],
    request: z.object({
      anak_id: Id,
      catatan: z.string().trim().min(1).max(2000),
      kata_baru_dikonfirmasi: z.array(z.string()).max(20).default([]),
    }),
    response: z.object({ catatan_id: Id, draf: Draf.nullable() }),
    layar: ["D5"],
    titik: "I2",
  }),
  rencanaSetujui: ep({
    metode: "POST",
    path: "/api/rencana/:drafId/setujui",
    akses: ["terapis"],
    request: z.object({ drafId: Id, isi: IsiRencana, mulai_sekarang: z.boolean().default(false) }),
    response: z.object({ rencana_id: Id, minggu_mulai: Tanggal }),
    galat: { 404: "Draf tidak ditemukan", 409: "Draf sudah diganti atau disetujui", 422: "Aktivitas di luar bank" },
    layar: ["D5"],
    titik: "I3",
  }),

  // Admin (orang Talkly): mengelola klinik dan akun terapis. Terapis tidak mendaftar sendiri.
  adminMasuk: ep({
    metode: "POST",
    path: "/api/admin/masuk",
    akses: ["publik"],
    request: z.object({ email: z.email(), kata_sandi: z.string().min(6).max(100) }),
    galat: { 401: "Email atau kata sandi salah" },
    layar: ["Masuk admin"],
    titik: "I2",
  }),
  adminRingkasan: ep({
    metode: "GET",
    path: "/api/admin/ringkasan",
    akses: ["admin"],
    response: z.object({
      admin: z.object({ nama: z.string(), email: z.string() }),
      total: z.object({
        klinik: z.number().int(),
        terapis: z.number().int(),
        anak: z.number().int(),
        keluarga: z.number().int(),
      }),
      klinik: z.array(
        z.object({
          id: Id,
          nama: z.string(),
          data_contoh: z.boolean(),
          terapis: z.number().int(),
          anak: z.number().int(),
        }),
      ),
      terapis: z.array(
        z.object({
          id: Id,
          nama: z.string(),
          email: z.string(),
          klinik_id: Id,
          klinik: z.string(),
          anak: z.number().int(),
          data_contoh: z.boolean(),
          dibuat: Waktu,
        }),
      ),
    }),
    layar: ["A1"],
    titik: "I2",
  }),
  adminTerapisBuat: ep({
    metode: "POST",
    path: "/api/admin/terapis",
    akses: ["admin"],
    request: z.object({
      nama: z.string().trim().min(2).max(60),
      email: z.email(),
      kata_sandi: z.string().min(8).max(100),
      /** Klinik yang sudah ada, atau isi klinik_baru untuk membuat klinik. */
      klinik_id: Id.optional(),
      klinik_baru: z.string().trim().min(2).max(80).optional(),
    }),
    response: z.object({ id: Id }),
    galat: { 409: "Email sudah dipakai", 422: "Pilih klinik atau tulis nama klinik baru" },
    layar: ["A1"],
    titik: "I2",
  }),
  adminTerapisHapus: ep({
    metode: "DELETE",
    path: "/api/admin/terapis/:id",
    akses: ["admin"],
    request: z.object({ id: Id }),
    galat: { 404: "Terapis tidak ditemukan", 409: "Akun data contoh tidak bisa dihapus" },
    layar: ["A1"],
    titik: "I2",
  }),

  // Lainnya
  demo: ep({
    metode: "POST",
    path: "/api/demo",
    akses: ["publik"],
    request: z.object({ sebagai: z.enum(["ibu_sari", "mbak_sri", "ibu_alya", "ibu_bima", "ibu_citra", "kak_nadia", "admin", "uji_b"]) }),
    galat: { 404: "Mode demo tidak aktif" },
    layar: ["Beranda"],
    titik: "I1",
  }),
  tesSambungan: ep({
    metode: "GET",
    path: "/api/tes-sambungan",
    akses: ["terapis", "publik"],
    response: z.object({
      supabase: z.object({ ok: z.boolean(), pesan: z.string() }),
      elevenlabs: z.object({ ok: z.boolean(), pesan: z.string() }),
      openai: z.object({ ok: z.boolean(), pesan: z.string() }),
      push: z.object({ ok: z.boolean(), pesan: z.string() }),
    }),
    layar: ["Cek perangkat"],
    titik: "I0",
  }),
  cronPengingat: ep({
    metode: "GET",
    path: "/api/cron/pengingat",
    akses: ["cron"],
    response: z.object({ notifikasi: z.number().int(), status_naik: z.number().int() }),
    layar: [],
    titik: "I3",
  }),
  cronBersihkanAudio: ep({
    metode: "GET",
    path: "/api/cron/bersihkan-audio",
    akses: ["cron"],
    response: z.object({ dihapus: z.number().int() }),
    layar: [],
    titik: "I3",
  }),
} as const satisfies Record<string, DefEndpoint>;

export type NamaEndpoint = keyof typeof API;
export type RequestDari<N extends NamaEndpoint> = (typeof API)[N] extends { request: z.ZodType }
  ? z.input<(typeof API)[N]["request"]>
  : undefined;
export type ResponseDari<N extends NamaEndpoint> = (typeof API)[N] extends { response: z.ZodType }
  ? z.output<(typeof API)[N]["response"]>
  : null;
