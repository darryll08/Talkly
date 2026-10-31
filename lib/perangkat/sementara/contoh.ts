// Data contoh layar orang tua (Raka, Ibu Sari, Mbak Sri, Kak Nadia) untuk NEXT_PUBLIC_PAKAI_CONTOH=1.
// Bisa berubah selama sesi peramban (tandai aktivitas, kirim pesan, izin) agar alur bisa dicoba tanpa server.
// Rekaman ...0006 = lolos, ...0007 = ditolak. Persona: localStorage "talkly:contoh-persona" = ibu_sari | mbak_sri.

import type { z } from "zod";
import type { api } from "./api";

type R<K extends keyof typeof api> = (typeof api)[K] extends { response: z.ZodType }
  ? z.input<(typeof api)[K]["response"]>
  : null;

export const ID_LOLOS = "00000000-0000-4000-8000-000000000006";
export const ID_DITOLAK = "00000000-0000-4000-8000-000000000007";

function persona(): "ibu_sari" | "mbak_sri" {
  try {
    return localStorage.getItem("talkly:contoh-persona") === "mbak_sri" ? "mbak_sri" : "ibu_sari";
  } catch {
    return "ibu_sari";
  }
}

const izin = {
  ibu_sari: { izin_nilai: true, izin_dengar: true, izin_klip: true },
  mbak_sri: { izin_nilai: false, izin_dengar: false, izin_klip: false },
};

const anak = {
  id: "anak-raka",
  nama: "Raka",
  tahap: 1,
  kata_target: ["bebek", "mandi", "air", "lagi", "mau"],
  terapis: { nama: "Kak Nadia" },
  klinik: { nama: "Klinik Tumbuh Kembang Ceria" },
};

function anggotaSaya() {
  const p = persona();
  return p === "ibu_sari"
    ? { id: "ang-sari", nama: "Ibu Sari", peran: "ibu" as const, pengelola: true, ...izin.ibu_sari }
    : { id: "ang-sri", nama: "Mbak Sri", peran: "pengasuh" as const, pengelola: false, ...izin.mbak_sri };
}

const selesai = new Set<string>(["ibu_sari:MAKAN-02"]);

const aktivitasData: Record<string, { judul: string; rutinitas: string; kata_target: string[]; langkah: string[]; bila_mencoba: string; bila_belum: string; untuk: "ibu_sari" | "mbak_sri" | "semua" }> = {
  "MANDI-01": {
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
    untuk: "ibu_sari",
  },
  "MAKAN-02": {
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
    untuk: "ibu_sari",
  },
  "MAKAN-05": {
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
    untuk: "mbak_sri",
  },
};

const pesanData = [
  { id: "p1", dari: "terapis" as const, nama: "Kak Nadia", isi: "Ibu, minggu ini fokus menunggu dulu ya. Setelah bertanya, hitung sampai lima dalam hati.", konteks: null, dibuat: "2026-10-26T09:12:00+07:00" },
  { id: "p2", dari: "saya" as const, nama: "Ibu Sari", isi: "Baik Kak. Raka sedang demam sejak Selasa, jadi lebih banyak diam.", konteks: "Catatan malam 28/10, anak demam", dibuat: "2026-10-28T20:40:00+07:00" },
  { id: "p3", dari: "terapis" as const, nama: "Kak Nadia", isi: "Terima kasih kabarnya, Bu. Kita bahas Sabtu. Istirahat dulu tidak apa-apa.", konteks: null, dibuat: "2026-10-29T08:05:00+07:00" },
];

const hasilLolos: R<"rekaman"> = {
  status: "dinilai",
  alasan_tolak: null,
  durasi_s: 58,
  rekaman_contoh: true,
  hasil: {
    rekaman_id: ID_LOLOS,
    mutu: { lolos: true, alasan: null, durasi_s: 58, kata_perekam: 41 },
    stt: { penyedia: "scribe", sumber_suara_anak: "label" },
    ajakan: [
      { t_mulai: 3.2, t_selesai: 4.9, teks: "Raka mau bebek?", kategori: "anak_merespons", jeda_s: 2.6 },
      { t_mulai: 12.0, t_selesai: 13.4, teks: "Bebek… mandi!", kategori: "menunggu_cukup", jeda_s: 4.8 },
      { t_mulai: 20.1, t_selesai: 21.0, teks: "Mana bebeknya?", kategori: "anak_merespons", jeda_s: 3.1 },
      { t_mulai: 33.5, t_selesai: 35.2, teks: "Raka mau mandi sama bebek nggak, sayang? Ayo dong mandi.", kategori: "memotong", jeda_s: 1.2 },
    ],
    ukuran: {
      jumlah_ajakan: 9, ajakan_berhasil: 6, memotong: 3, jeda_rata_s: 3.8, giliran: 6, vokalisasi_anak: 5,
      ucapan_kata_target: 4, pertanyaan_beruntun: 1, suruhan_beruntun: 0, perluasan_ai: 1,
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

const hasilDitolak: R<"rekaman"> = {
  status: "ditolak",
  alasan_tolak: "Suara televisi lebih keras daripada suara Ibu selama 35 dari 58 detik, jadi percakapan Ibu dan Raka tidak bisa dibedakan.",
  durasi_s: 58,
  rekaman_contoh: true,
  hasil: null,
};

const tanyaRekaman = new Map<string, number>();

type Penangan = (d: Record<string, unknown> | undefined) => unknown;

export const PETA_CONTOH: Record<string, Penangan> = {
  "GET /api/saya": () => ({ anggota: anggotaSaya(), anak }),
  "DELETE /api/saya": () => null,
  "GET /api/saya/izin": () => ({ izin: izin[persona()], penjelasan: PENJELASAN, dasar_hukum: DASAR }),
  "PATCH /api/saya/izin": (d) => {
    const lama = izin[persona()];
    const dihapus = lama.izin_dengar && d?.izin_dengar === false ? 2 : 0;
    Object.assign(lama, d);
    return { izin: lama, penjelasan: PENJELASAN, dasar_hukum: DASAR, audio_dihapus: dihapus };
  },
  "POST /api/saya/kode-masuk": () => ({ kode_masuk: "TLK-7Q4M-2KXP" }),
  "GET /api/undangan/:kode": (d) => {
    const kode = String(d?.kode ?? "").toUpperCase();
    if (kode.startsWith("DIPAKAI")) return { status: "dipakai", peran: "ibu", anak: { nama: "Raka" }, klinik: anak.klinik, terapis: anak.terapis, diundang_oleh: null };
    if (kode.startsWith("LAMA")) return { status: "kedaluwarsa", peran: "ibu", anak: { nama: "Raka" }, klinik: anak.klinik, terapis: anak.terapis, diundang_oleh: null };
    const pengasuh = kode.startsWith("SRI");
    return {
      status: "menunggu",
      peran: pengasuh ? "pengasuh" : "ibu",
      anak: { nama: "Raka" },
      klinik: anak.klinik,
      terapis: anak.terapis,
      diundang_oleh: pengasuh ? "Ibu Sari" : null,
    };
  },
  "POST /api/gabung": () => ({ kode_masuk: "TLK-3HRW-9MNA" }),
  "POST /api/masuk": (d) => {
    if (String(d?.kode_masuk).toUpperCase().includes("SALAH")) throw Object.assign(new Error("Kode salah."), { status: 401 });
    return null;
  },
  "POST /api/undangan": () => ({
    kode: "SRI8K2PQ",
    tautan: "https://talkly-boomerang.vercel.app/gabung?kode=SRI8K2PQ",
    kedaluwarsa: "2026-11-07T23:59:00+07:00",
  }),
  "DELETE /api/anggota/:id": () => null,
  "GET /api/hari-ini": () => {
    const p = persona();
    const aktivitas = Object.entries(aktivitasData)
      .filter(([, a]) => a.untuk === p || a.untuk === "semua")
      .map(([item_id, a]) => ({ item_id, judul: a.judul, rutinitas: a.rutinitas, kata_target: a.kata_target, selesai_hari_ini: selesai.has(`${p}:${item_id}`) }));
    return {
      anggota: anggotaSaya(),
      anak,
      terapis: anak.terapis,
      rencana: {
        pesan_keluarga: p === "ibu_sari"
          ? "Minggu ini kita fokus menunggu. Setelah bertanya, hitung sampai lima dalam hati, lalu biarkan Raka yang mengisi diamnya."
          : "Mbak Sri, saat makan siang coba tahan tutup kotak bekal sebentar dan tunggu Raka bersuara dulu.",
        baru: false,
      },
      aktivitas,
      hari_aktif_minggu_ini: p === "ibu_sari" ? 4 : 3,
      kabar_keluarga: p === "ibu_sari" ? [{ nama: "Mbak Sri", isi: "mengerjakan Buka tutup kotak bekal", waktu: "12.10" }] : [],
    };
  },
  "GET /api/aktivitas/:itemId": (d) => {
    const a = aktivitasData[String(d?.itemId)];
    if (!a) throw Object.assign(new Error("Aktivitas tidak ditemukan."), { status: 404 });
    return { judul: a.judul, rutinitas: a.rutinitas, kata_target: a.kata_target, langkah: a.langkah, bila_mencoba: a.bila_mencoba, bila_belum: a.bila_belum, selesai_hari_ini: selesai.has(`${persona()}:${d?.itemId}`) };
  },
  "POST /api/aktivitas/:itemId": (d) => {
    selesai.add(`${persona()}:${d?.itemId}`);
    return null;
  },
  "GET /api/rekaman/:id": (d) => {
    const id = String(d?.id);
    const n = (tanyaRekaman.get(id) ?? 0) + 1;
    tanyaRekaman.set(id, n);
    if (n < 3) return { status: "antre", alasan_tolak: null, durasi_s: 58, rekaman_contoh: true, hasil: null };
    return id === ID_DITOLAK ? hasilDitolak : hasilLolos;
  },
  "POST /api/rekaman/:id/kurang-tepat": () => null,
  "POST /api/laporan": (d) => {
    const isi = (d as { isi?: { regresi?: boolean; dibanding_biasanya?: string } } | undefined)?.isi;
    const naik = Boolean(isi?.regresi) || isi?.dibanding_biasanya === "lebih_sedikit";
    return {
      pesan: naik
        ? "Kak Nadia sudah diberi tahu dan akan membahasnya di sesi Sabtu."
        : "Catatan tersimpan. Kak Nadia akan membacanya sebelum sesi.",
      terapis_diberi_tahu: naik,
    };
  },
  "GET /api/kemajuan": () =>
    persona() === "mbak_sri"
      ? {
          anak: { nama: "Raka" },
          strategi: { jeda_rata_s: null, giliran_per_menit: null, data_cukup: false, rekaman: 1, ajakan: 8 },
          tren: [],
          kata_anak: KATA,
        }
      : {
          anak: { nama: "Raka" },
          strategi: { jeda_rata_s: 3.8, giliran_per_menit: 3, data_cukup: true, rekaman: 7, ajakan: 61 },
          tren: [
            { minggu_mulai: "2026-10-12", jeda_rata_s: 2.1, giliran_per_menit: 1 },
            { minggu_mulai: "2026-10-19", jeda_rata_s: 3.0, giliran_per_menit: 2 },
            { minggu_mulai: "2026-10-26", jeda_rata_s: 3.8, giliran_per_menit: 3 },
          ],
          kata_anak: KATA,
        },
  "GET /api/keluarga-minggu-ini": () => ({
    minggu_mulai: "2026-10-26",
    anggota: [
      { id: "ang-sari", nama: "Ibu Sari", peran: "ibu", saya: persona() === "ibu_sari", pengelola: true, izin_nilai: izin.ibu_sari.izin_nilai, hari_aktif: [true, true, false, true, true, false, false], aktivitas: ["Bebek di bak mandi", "Minta lagi saat makan"], kalimat: "Ibu Sari menunggu Raka bersuara di tiga rekaman minggu ini." },
      { id: "ang-sri", nama: "Mbak Sri", peran: "pengasuh", saya: persona() === "mbak_sri", pengelola: false, izin_nilai: izin.mbak_sri.izin_nilai, hari_aktif: [true, false, true, true, false, false, false], aktivitas: ["Buka tutup kotak bekal"], kalimat: "Mbak Sri mengerjakan Buka tutup kotak bekal saat makan siang." },
    ],
  }),
  "GET /api/pesan": () => ({ terapis: anak.terapis, pesan: pesanData.map((p) => ({ ...p, dari: p.dari === "saya" && persona() !== "ibu_sari" ? "keluarga" : p.dari })) }),
  "POST /api/pesan": (d) => {
    const id = `p${pesanData.length + 1}`;
    pesanData.push({ id, dari: "saya", nama: anggotaSaya().nama, isi: String(d?.isi ?? ""), konteks: (d?.konteks as string) ?? null, dibuat: new Date().toISOString() });
    return { id };
  },
  "POST /api/kartu-benda": (d) => {
    const nama = String(d?.nama_benda ?? "").trim().toLowerCase();
    return { kata: nama.split(/\s+/)[0], contoh_kalimat: [`${nama}… mana?`, `${nama}… lagi!`] };
  },
  "POST /api/push": () => null,
  "POST /api/demo": (d) => {
    try {
      if (d?.sebagai === "ibu_sari" || d?.sebagai === "mbak_sri") localStorage.setItem("talkly:contoh-persona", String(d.sebagai));
    } catch {}
    return null;
  },
  "GET /api/tes-sambungan": () => ({
    layanan: [
      { nama: "Supabase", ok: true, catatan: "data contoh" },
      { nama: "ElevenLabs", ok: true, catatan: "data contoh" },
      { nama: "OpenAI", ok: true, catatan: "data contoh" },
      { nama: "Push (VAPID)", ok: false, catatan: "kunci VAPID belum dipasang" },
    ],
  }),
};

const KATA = [
  { kata: "mama", sejak: "2026-10-03", sumber: "dikonfirmasi" as const },
  { kata: "bek", sejak: "2026-10-17", sumber: "dikonfirmasi" as const },
  { kata: "mam", sejak: "2026-10-21", sumber: "dikonfirmasi" as const },
  { kata: "cing", sejak: "2026-10-29", sumber: "dilaporkan" as const },
  { kata: "agi", sejak: "2026-10-30", sumber: "dilaporkan" as const },
];

const DASAR = "Pasal 56 Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi";

const PENJELASAN = [
  { kunci: "izin_nilai" as const, judul: "Rekaman saya boleh dinilai", isi: "Suara Anda diubah menjadi teks oleh ElevenLabs, lalu teksnya (tanpa nama) dipakai OpenAI untuk memilih umpan balik. Audio dihapus setelah dinilai bila izin dengar mati.", penyedia: "ElevenLabs, OpenAI", negara: "Amerika Serikat", wajib_untuk: "Perlu untuk Rekam 1 Menit dan umpan balik." },
  { kunci: "izin_dengar" as const, judul: "Terapis boleh mendengar rekaman", isi: "Audio disimpan 7 hari di Supabase dan hanya bisa diputar terapis anak Anda, tanpa bisa diunduh. Setiap pemutaran tercatat.", penyedia: "Supabase", negara: "Singapura", wajib_untuk: "Perlu agar Kak Nadia bisa mendengar rekaman sebelum sesi." },
  { kunci: "izin_klip" as const, judul: "Klip Momen anak boleh diputar keluarga", isi: "Klip 5 detik disimpan hanya di ponsel ini dan bisa diputar pengelola keluarga.", penyedia: "Ponsel Anda", negara: "Tidak dikirim", wajib_untuk: "Perlu untuk Momen Raka di umpan balik." },
];
