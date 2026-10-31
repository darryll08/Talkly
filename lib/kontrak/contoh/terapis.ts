import type { ResponseDari } from "../api";
import { CONTOH_ORTU, ID } from "./ortu";

// Data contoh khusus layar D yang diminta prompt C; bukan data pasien atau hasil uji.
export const ID_RAKA = ID.raka;
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const terapis = { id: ID.nadia, nama: "Kak Nadia" };

export const CONTOH_MINGGU_INI = {
  terapis,
  ringkasan: { total: 25, bahas: 1, meninjau: 2, lanjut: 22 },
  hari: [
    {
      tanggal: "2026-10-31",
      nama_hari: "Sabtu",
      anak: Array.from({ length: 25 }, (_, index) => ({
        id: index === 0 ? ID_RAKA : id(index + 1),
        nama: index === 0 ? "Raka" : index === 1 ? "Alya" : index === 2 ? "Bima" : `Anak contoh ${index + 1}`,
        usia_bulan: 28,
        tahap: 1,
        status: index === 1 ? "bahas_minggu_ini" as const : index < 3 ? "terapis_meninjau" as const : "lanjut" as const,
        pemicu: index === 1 ? "Keluarga melaporkan kata yang dahulu dipakai tidak lagi terdengar." : index < 3 ? "Laporan keluarga perlu ditinjau terapis." : null,
        jam_sesi: `${String(8 + Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`,
        hari_aktif_7: 4,
        data_contoh: true,
      })).sort((a, b) => {
        const urut = { bahas_minggu_ini: 0, terapis_meninjau: 1, lanjut: 2 };
        return urut[a.status] - urut[b.status];
      }),
    },
    { tanggal: "2026-11-01", nama_hari: "Minggu", anak: [] },
    { tanggal: "2026-11-02", nama_hari: "Senin", anak: [] },
  ],
} satisfies ResponseDari<"mingguIni">;

export const CONTOH_ANAK = {
  id: ID_RAKA,
  nama: "Raka",
  tanggal_lahir: "2024-06-30",
  pendengaran: "normal",
  tahap: 1,
  strategi_fokus: "Memberi waktu menunggu setelah ajakan.",
  kata_target: ["bebek", "mandi", "air", "lagi", "mau"],
  aktivitas_id: ["MANDI-01"],
  ukuran_nonaktif: [],
  minat: "Bebek mainan",
  rutinitas: "Bermain sore",
  hari_sesi: 6,
  jam_sesi: "08:00",
  status: "terapis_meninjau",
  data_contoh: true,
} satisfies ResponseDari<"anakLihat">;

// Referensi aktivitas ini khusus fixture dan tidak boleh dikirim ke API nyata.
export const CONTOH_BANK = {
  aktivitas: [{ id: "MANDI-01", judul: "Bebek di bak mandi", rutinitas: "Mandi sore", tahap: 1 }],
} satisfies ResponseDari<"aktivitasBank">;

export const CONTOH_TERAPIS = {
  mingguIni: CONTOH_MINGGU_INI,
  aktivitasBank: CONTOH_BANK,
  anakBuat: { id: ID_RAKA },
  anakLihat: CONTOH_ANAK,
  anakUbah: { id: ID_RAKA },
  anakUndangan: { undangan: [] },
  setelahSesiLihat: { catatan: null, draf: null },
  setelahSesiSimpan: { catatan_id: id(200), draf: null },
  anakPesanLihat: CONTOH_ORTU.pesanLihat,
  anakKartu: {
    anak: { ...CONTOH_ORTU.kemajuan.anak, usia_bulan: 28, status: "terapis_meninjau", pemicu: "Laporan keluarga perlu ditinjau terapis.", pendengaran: "normal", data_contoh: true },
    strategi: CONTOH_ORTU.kemajuan.strategi,
    tren: CONTOH_ORTU.kemajuan.tren,
    per_pengasuh: [
      { anggota_id: ID.sari, nama: "Ibu Sari", peran: "ibu", rekaman: 7, jeda_rata_s: 3.8, giliran_per_menit: 3, hari_aktif_7: 4 },
      { anggota_id: ID.sri, nama: "Mbak Sri", peran: "pengasuh", rekaman: 1, jeda_rata_s: null, giliran_per_menit: null, hari_aktif_7: 2 },
    ],
    rekaman_terpilih: {
      id: ID.rekamanLolos, dibuat: "2026-10-31T10:00:00+07:00", perekam: "Ibu Sari", durasi_s: 60,
      ajakan: CONTOH_ORTU.rekamanLihat.hasil!.ajakan,
      suara_anak: CONTOH_ORTU.rekamanLihat.hasil!.suara_anak,
      ukuran: CONTOH_ORTU.rekamanLihat.hasil!.ukuran,
      laporan_terapis: CONTOH_ORTU.rekamanLihat.hasil!.laporan_terapis,
      bisa_didengar: true,
    },
    rekaman_terbaru: [{ id: ID.rekamanLolos, dibuat: "2026-10-31T10:00:00+07:00", perekam: "Ibu Sari", status: "dinilai", jeda_rata_s: 3.8, bisa_didengar: true }],
    laporan_keluarga: [{ id: ID.laporan, tanggal: "2026-10-28", nama: "Ibu Sari", laporan: { jenis: "catatan_malam", isi: { kata_baru: ["bebek"], catatan: "Raka demam dan lebih banyak diam.", kondisi: "demam", regresi: false, lebih_sedikit_bersuara: true } } }],
    kata_dilaporkan: [{ kata: "bebek", sejak: "2026-10-28" }],
    kutipan_regresi: [],
    saran_sesi: ["Bahas kabar keluarga dan praktikkan jeda menunggu saat sesi."],
  },
} satisfies {
  [N in "mingguIni" | "aktivitasBank" | "anakBuat" | "anakLihat" | "anakUbah" | "anakUndangan" | "setelahSesiLihat" | "setelahSesiSimpan" | "anakPesanLihat" | "anakKartu"]: ResponseDari<N>;
};

export const CONTOH_ANAK_NAMA_PANJANG = {
  ...CONTOH_ANAK,
  nama: "Raka Adiputra Pratama dengan Nama Panjang",
} satisfies ResponseDari<"anakLihat">;
