import type { NamaEndpoint, ResponseDari } from "../api";

// Contoh response untuk layar orang tua dan beranda (ditulis B). Data contoh: Raka, Ibu Sari, Mbak Sri, Kak Nadia.
// VARIAN_ORTU memuat keadaan sulit (rekaman ditolak, data belum cukup, daftar kosong, persona Mbak Sri)
// yang dipakai lib/perangkat/contoh.ts saat NEXT_PUBLIC_PAKAI_CONTOH=1.

export const ID = {
  raka: "6f1d2a40-0000-4000-8000-0000000000a1",
  sari: "6f1d2a40-0000-4000-8000-0000000000b1",
  sri: "6f1d2a40-0000-4000-8000-0000000000b2",
  nadia: "6f1d2a40-0000-4000-8000-0000000000c1",
  rencana: "6f1d2a40-0000-4000-8000-0000000000d1",
  itemMandi: "6f1d2a40-0000-4000-8000-0000000000e1",
  itemMakan: "6f1d2a40-0000-4000-8000-0000000000e2",
  itemBekal: "6f1d2a40-0000-4000-8000-0000000000e3",
  rekamanLolos: "6f1d2a40-0000-4000-8000-0000000000f6",
  rekamanDitolak: "6f1d2a40-0000-4000-8000-0000000000f7",
  pesan1: "6f1d2a40-0000-4000-8000-000000000101",
  pesan2: "6f1d2a40-0000-4000-8000-000000000102",
  pesan3: "6f1d2a40-0000-4000-8000-000000000103",
  laporan: "6f1d2a40-0000-4000-8000-000000000201",
} as const;

const terapis = { id: ID.nadia, nama: "Kak Nadia" };
const anak = { id: ID.raka, nama: "Raka", tahap: 1, kata_target: ["bebek", "mandi", "air", "lagi", "mau"], terapis };
const sari = { id: ID.sari, nama: "Ibu Sari", peran: "ibu" as const, pengelola: true, izin_nilai: true, izin_dengar: true, izin_klip: true };
const sri = { id: ID.sri, nama: "Mbak Sri", peran: "pengasuh" as const, pengelola: false, izin_nilai: false, izin_dengar: false, izin_klip: false };

const PENJELASAN = [
  {
    kunci: "izin_nilai" as const,
    judul: "Rekaman saya boleh dinilai",
    isi: "Suara Anda diubah menjadi teks oleh ElevenLabs, lalu teksnya (nama disamarkan) dipakai OpenAI untuk memilih umpan balik. Audio dihapus setelah dinilai bila izin dengar mati.",
    penyedia: "ElevenLabs, OpenAI",
    negara: "Amerika Serikat",
    wajib_untuk: "Perlu untuk Rekam 1 Menit dan umpan balik.",
  },
  {
    kunci: "izin_dengar" as const,
    judul: "Terapis boleh mendengar rekaman",
    isi: "Audio disimpan 7 hari dan hanya bisa diputar terapis anak Anda, tanpa bisa diunduh. Setiap pemutaran tercatat.",
    penyedia: "Supabase",
    negara: "Singapura",
    wajib_untuk: "Perlu agar Kak Nadia bisa mendengar rekaman sebelum sesi.",
  },
  {
    kunci: "izin_klip" as const,
    judul: "Klip Momen anak boleh diputar keluarga",
    isi: "Klip 5 detik disimpan hanya di ponsel ini dan bisa diputar pengelola keluarga.",
    penyedia: "Ponsel Anda",
    negara: "Tidak dikirim",
    wajib_untuk: "Perlu untuk Momen Raka di umpan balik.",
  },
];

const AKTIVITAS = {
  [ID.itemMandi]: {
    item_id: ID.itemMandi,
    aktivitas_id: "MANDI-01",
    judul: "Bebek di bak mandi",
    rutinitas: "Mandi sore",
    kata_target: ["bebek", "mandi", "air"],
    langkah: [
      "Pegang bebek di dekat wajah Ibu, sebut \"bebek\" dua kali dengan pelan.",
      "Celupkan bebek ke air sambil bilang \"bebek… mandi!\", lalu diam dan hitung sampai lima dalam hati.",
      "Tunggu Raka bersuara atau meraih bebek sebelum Ibu bicara lagi.",
    ],
    bila_mencoba: "Ulangi kata Raka lalu tambah satu kata: \"bek!\" → \"bebek mandi!\"",
    bila_belum: "Tidak apa-apa. Sebut sekali lagi dengan senyum, lalu berikan bebeknya.",
  },
  [ID.itemMakan]: {
    item_id: ID.itemMakan,
    aktivitas_id: "MAKAN-02",
    judul: "Minta lagi saat makan",
    rutinitas: "Makan malam",
    kata_target: ["lagi", "mau"],
    langkah: [
      "Beri satu suap kecil, lalu tahan suapan berikutnya di depan Raka.",
      "Tanya \"mau… lagi?\" lalu diam, hitung sampai lima.",
      "Begitu Raka bersuara atau menunjuk, langsung berikan sambil bilang \"lagi!\"",
    ],
    bila_mencoba: "Ulangi kata Raka dan berikan suapannya segera.",
    bila_belum: "Sebut \"lagi\" sekali, lalu berikan. Jangan minta Raka mengulang.",
  },
  [ID.itemBekal]: {
    item_id: ID.itemBekal,
    aktivitas_id: "MAKAN-05",
    judul: "Buka tutup kotak bekal",
    rutinitas: "Makan siang",
    kata_target: ["buka", "mau"],
    langkah: [
      "Tutup kotak bekal lalu letakkan di depan Raka.",
      "Pegang tutupnya dan bilang \"buka?\" lalu tunggu sampai hitungan lima.",
      "Saat Raka bersuara atau mendorong tutupnya, buka sambil bilang \"buka!\"",
    ],
    bila_mencoba: "Ulangi suara Raka lalu tambah satu kata: \"bu!\" → \"buka kotak!\"",
    bila_belum: "Buka kotaknya sambil sebut \"buka\" sekali dengan ceria.",
  },
} as const;

export const AKTIVITAS_CONTOH = AKTIVITAS;

const ringkasAktivitas = (id: keyof typeof AKTIVITAS, selesai: boolean) => {
  const a = AKTIVITAS[id];
  return { item_id: a.item_id, aktivitas_id: a.aktivitas_id, judul: a.judul, rutinitas: a.rutinitas, kata_target: [...a.kata_target], selesai_hari_ini: selesai };
};

const hasilLolos: ResponseDari<"rekamanLihat"> = {
  id: ID.rekamanLolos,
  status: "dinilai",
  alasan_tolak: null,
  durasi_s: 58,
  rekaman_contoh: true,
  perekam: { id: ID.sari, nama: "Ibu Sari" },
  hasil: {
    rekaman_id: ID.rekamanLolos,
    mutu: { lolos: true, alasan: null, durasi_s: 58, kata_perekam: 41 },
    stt: { penyedia: "scribe", sumber_suara_anak: "label" },
    ajakan: [
      { t_mulai: 3.2, t_selesai: 4.9, teks: "Raka mau bebek?", kategori: "anak_merespons", jeda_s: 2.6 },
      { t_mulai: 12.0, t_selesai: 13.4, teks: "Bebek… mandi!", kategori: "menunggu_cukup", jeda_s: 4.8 },
      { t_mulai: 20.1, t_selesai: 21.0, teks: "Mana bebeknya?", kategori: "anak_merespons", jeda_s: 3.1 },
      { t_mulai: 33.5, t_selesai: 35.2, teks: "Raka mau mandi sama bebek nggak, sayang? Ayo dong mandi.", kategori: "memotong", jeda_s: 1.2 },
    ],
    suara_anak: [
      { t_mulai: 7.5, t_selesai: 8.1 },
      { t_mulai: 24.1, t_selesai: 24.6 },
    ],
    ukuran: {
      jumlah_ajakan: 9,
      ajakan_berhasil: 6,
      memotong: 3,
      jeda_rata_s: 3.8,
      giliran: 6,
      vokalisasi_anak: 5,
      ucapan_kata_target: 4,
      pertanyaan_beruntun: 1,
      suruhan_beruntun: 0,
      perluasan_ai: 1,
    },
    umpan_balik: {
      pujian_id: "P03",
      saran_id: "S07",
      teks_pujian: "Ibu menunggu sampai Raka bersuara 4 kali. Saat Raka bilang \"bek\", Ibu menjawab \"bebek mandi\". Itu persis yang dilatih minggu ini.",
      teks_saran: "Tunggu juga setelah bertanya \"mau apa?\". Biarkan Raka yang mengisi diamnya.",
      kutipan: "Raka mau mandi sama bebek nggak, sayang? Ayo dong mandi.",
      versi_anak: "Bebek… mandi!",
      momen: { t_mulai: 21, t_selesai: 26 },
      sumber: "ai",
    },
    laporan_terapis: "Jeda rata-rata 3,8 detik; 6 giliran; satu perluasan.",
    naikkan_status: false,
  },
};

export const CONTOH_ORTU = {
  undanganLihat: {
    status: "menunggu",
    peran: "ibu",
    anak: { nama: "Raka" },
    klinik: { nama: "Klinik Tumbuh Kembang Ceria" },
    terapis: { nama: "Kak Nadia" },
  },
  gabung: { kode_masuk: "TLK-3HRW-9MNA", anggota_id: ID.sari },
  saya: { anggota: sari, anak },
  izinLihat: {
    izin: { izin_nilai: true, izin_dengar: true, izin_klip: true },
    penjelasan: PENJELASAN,
    dasar_hukum: "Pasal 56 Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi",
  },
  izinUbah: { izin: { izin_nilai: true, izin_dengar: false, izin_klip: true }, audio_dihapus: 2 },
  kodeMasukBaru: { kode_masuk: "TLK-7Q4M-2KXP" },
  undanganBuat: {
    kode: "SRI8K2PQ",
    tautan: "https://talkly.vercel.app/gabung?kode=SRI8K2PQ",
    kedaluwarsa: "2026-11-07T23:59:00+07:00",
  },
  hariIni: {
    anggota: sari,
    anak,
    terapis,
    rencana: {
      id: ID.rencana,
      pesan_keluarga:
        "Minggu ini kita fokus menunggu. Setelah bertanya, hitung sampai lima dalam hati, lalu biarkan Raka yang mengisi diamnya.",
      baru: false,
      minggu_mulai: "2026-10-26",
    },
    aktivitas: [ringkasAktivitas(ID.itemMandi, false), ringkasAktivitas(ID.itemMakan, true)],
    hari_aktif_minggu_ini: 4,
    kabar_keluarga: [{ nama: "Mbak Sri", kalimat: "Mbak Sri mengerjakan Buka tutup kotak bekal pukul 12.10." }],
  },
  aktivitasLihat: { ...AKTIVITAS[ID.itemMandi], langkah: [...AKTIVITAS[ID.itemMandi].langkah], kata_target: [...AKTIVITAS[ID.itemMandi].kata_target], selesai_hari_ini: false },
  rekamanUnggah: { rekaman_id: ID.rekamanLolos },
  rekamanLihat: hasilLolos,
  laporan: { id: ID.laporan, pesan: "Catatan tersimpan. Kak Nadia akan membacanya sebelum sesi.", terapis_diberi_tahu: false },
  kemajuan: {
    anak,
    strategi: {
      data_cukup: true,
      rekaman: 7,
      ajakan: 61,
      jeda_rata_s: { nilai: 3.8, bawah: 3.2, atas: 4.4 },
      giliran_per_menit: { nilai: 3, bawah: 2.4, atas: 3.6 },
      ajakan_berhasil_persen: { nilai: 67, bawah: 55, atas: 78 },
      vokalisasi_per_menit: { nilai: 5, bawah: 4, atas: 6 },
    },
    tren: [
      { minggu_mulai: "2026-10-12", jeda_rata_s: 2.1, giliran_per_menit: 1, vokalisasi_per_minggu: 9, rekaman: 2 },
      { minggu_mulai: "2026-10-19", jeda_rata_s: 3.0, giliran_per_menit: 2, vokalisasi_per_minggu: 14, rekaman: 3 },
      { minggu_mulai: "2026-10-26", jeda_rata_s: 3.8, giliran_per_menit: 3, vokalisasi_per_minggu: 18, rekaman: 2 },
    ],
    kata_anak: [
      { kata: "mama", sejak: "2026-10-03", sumber: "dikonfirmasi_terapis" },
      { kata: "bek", sejak: "2026-10-17", sumber: "dikonfirmasi_terapis" },
      { kata: "mam", sejak: "2026-10-21", sumber: "dikonfirmasi_terapis" },
      { kata: "cing", sejak: "2026-10-29", sumber: "dilaporkan_keluarga" },
      { kata: "agi", sejak: "2026-10-30", sumber: "dilaporkan_keluarga" },
    ],
  },
  keluargaMingguIni: {
    minggu_mulai: "2026-10-26",
    anggota: [
      {
        id: ID.sari,
        nama: "Ibu Sari",
        peran: "ibu",
        saya: true,
        izin_nilai: true,
        hari_aktif: 4,
        aktivitas: [
          { judul: "Bebek di bak mandi", kali: 3 },
          { judul: "Minta lagi saat makan", kali: 2 },
        ],
        kalimat: "Ibu Sari menunggu Raka bersuara di tiga rekaman minggu ini.",
      },
      {
        id: ID.sri,
        nama: "Mbak Sri",
        peran: "pengasuh",
        saya: false,
        izin_nilai: false,
        hari_aktif: 3,
        aktivitas: [{ judul: "Buka tutup kotak bekal", kali: 3 }],
        kalimat: "Mbak Sri mengerjakan Buka tutup kotak bekal saat makan siang.",
      },
    ],
  },
  pesanLihat: {
    pesan: [
      { id: ID.pesan1, dari: "terapis", nama: "Kak Nadia", isi: "Ibu, minggu ini fokus menunggu dulu ya. Setelah bertanya, hitung sampai lima dalam hati.", konteks: null, dibuat: "2026-10-26T09:12:00+07:00" },
      { id: ID.pesan2, dari: "keluarga", nama: "Ibu Sari", isi: "Baik Kak. Raka sedang demam sejak Selasa, jadi lebih banyak diam.", konteks: "Catatan malam 28/10, anak demam", dibuat: "2026-10-28T20:40:00+07:00" },
      { id: ID.pesan3, dari: "terapis", nama: "Kak Nadia", isi: "Terima kasih kabarnya, Bu. Kita bahas Sabtu. Istirahat dulu tidak apa-apa.", konteks: null, dibuat: "2026-10-29T08:05:00+07:00" },
    ],
  },
  pesanKirim: { id: ID.pesan3, dari: "keluarga", nama: "Ibu Sari", isi: "Siap, Kak.", konteks: null, dibuat: "2026-10-31T19:00:00+07:00" },
  kartuBenda: { kata: "bebek", contoh_kalimat: ["Bebek… mana?", "Bebek… mandi!"] },
  tesSambungan: {
    supabase: { ok: true, pesan: "data contoh" },
    elevenlabs: { ok: true, pesan: "data contoh" },
    openai: { ok: true, pesan: "data contoh" },
    push: { ok: false, pesan: "kunci VAPID belum dipasang" },
  },
} satisfies { [N in NamaEndpoint]?: ResponseDari<N> };

/** Keadaan sulit untuk mencoba layar dengan data contoh. */
export const VARIAN_ORTU = {
  sayaSri: { anggota: sri, anak } satisfies ResponseDari<"saya">,
  hariIniSri: {
    ...CONTOH_ORTU.hariIni,
    anggota: sri,
    rencana: {
      id: ID.rencana,
      pesan_keluarga: "Mbak Sri, saat makan siang coba tahan tutup kotak bekal sebentar dan tunggu Raka bersuara dulu.",
      baru: false,
      minggu_mulai: "2026-10-26",
    },
    aktivitas: [ringkasAktivitas(ID.itemBekal, false)],
    hari_aktif_minggu_ini: 3,
    kabar_keluarga: [],
  } satisfies ResponseDari<"hariIni">,
  hariIniTanpaRencana: { ...CONTOH_ORTU.hariIni, rencana: null, aktivitas: [] } satisfies ResponseDari<"hariIni">,
  rekamanDitolak: {
    id: ID.rekamanDitolak,
    status: "ditolak",
    alasan_tolak:
      "Suara televisi lebih keras daripada suara Ibu selama 35 dari 58 detik, jadi percakapan Ibu dan Raka tidak bisa dibedakan.",
    durasi_s: 58,
    rekaman_contoh: true,
    perekam: { id: ID.sari, nama: "Ibu Sari" },
    hasil: null,
  } satisfies ResponseDari<"rekamanLihat">,
  kemajuanBelumCukup: {
    ...CONTOH_ORTU.kemajuan,
    strategi: {
      data_cukup: false,
      rekaman: 1,
      ajakan: 8,
      jeda_rata_s: { nilai: null, bawah: null, atas: null },
      giliran_per_menit: { nilai: null, bawah: null, atas: null },
      ajakan_berhasil_persen: { nilai: null, bawah: null, atas: null },
      vokalisasi_per_menit: { nilai: null, bawah: null, atas: null },
    },
    tren: [],
  } satisfies ResponseDari<"kemajuan">,
};
