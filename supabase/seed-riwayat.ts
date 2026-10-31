// Riwayat data contoh untuk seed (A2.2): tiga minggu rekaman dan laporan keluarga Raka, serta 8 anak lain.
// Semua angka di sini adalah data contoh berlabel, bukan data pengguna.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ajakan, HasilRekaman } from "../lib/kontrak/hasil";
import { isiTemplat, pilihCadangan } from "../lib/ai/templat";
import { ID_CONTOH } from "../lib/server/data-contoh";

const HARI = 86_400_000;
const BAWAAN_LAPORAN = { kata_baru: [], kondisi: null, regresi: false, lebih_sedikit_bersuara: false, dibuat: new Date().toISOString() };
const WIB = 7 * 3600_000;

/** yyyy-mm-dd (WIB) untuk `hariLalu` hari sebelum hari ini. */
const tanggal = (hariLalu: number) => new Date(Date.now() + WIB - hariLalu * HARI).toISOString().slice(0, 10);
/** Waktu ISO pada jam tertentu (WIB) `hariLalu` hari sebelum hari ini. */
const waktu = (hariLalu: number, jam = 17) => new Date(Date.parse(`${tanggal(hariLalu)}T${String(jam).padStart(2, "0")}:00:00Z`) - WIB).toISOString();
/** Berapa hari sejak Senin minggu ini (0 = Senin). */
const hariSejakSenin = () => (new Date(Date.now() + WIB).getUTCDay() + 6) % 7;

type Profil = { jeda: number; giliran: number; vokal: number; suruhan: number; kata_target: number };

/** Hasil rekaman contoh yang konsisten dengan kontrak: 9 ajakan dengan rata-rata jeda sesuai profil. */
export function hasilContoh(rekamanId: string, p: Profil, sapaan: string): HasilRekaman {
  const sebar = [-1.2, -0.8, -0.4, 0, 0, 0, 0.4, 0.8, 1.2];
  const ajakan: Ajakan[] = [];
  const suara: { t_mulai: number; t_selesai: number }[] = [];
  let merespons = 0;
  sebar.forEach((d, i) => {
    const jeda = Math.max(0.6, Math.round((p.jeda + d) * 10) / 10);
    const t = 3 + i * 6;
    let kategori: Ajakan["kategori"] = jeda >= 4 ? "menunggu_cukup" : "memotong";
    if (merespons < p.vokal && jeda >= 2.5) {
      kategori = "anak_merespons";
      merespons++;
      suara.push({ t_mulai: Math.round((t + 1 + jeda) * 10) / 10, t_selesai: Math.round((t + 1.5 + jeda) * 10) / 10 });
    }
    ajakan.push({ t_mulai: t, t_selesai: t + 1, teks: ["bebek?", "mau mamam?", "lagi?", "buka?", "ini apa?", "bebek mandi", "mau?", "lagi ya", "mana bebeknya?"][i], kategori, jeda_s: jeda });
  });
  const berhasil = ajakan.filter((a) => a.kategori !== "memotong").length;
  const ukuran = {
    jumlah_ajakan: ajakan.length,
    ajakan_berhasil: berhasil,
    memotong: ajakan.length - berhasil,
    jeda_rata_s: Math.round((ajakan.reduce((n, a) => n + a.jeda_s, 0) / ajakan.length) * 10) / 10,
    giliran: p.giliran,
    vokalisasi_anak: suara.length,
    ucapan_kata_target: p.kata_target,
    pertanyaan_beruntun: 0,
    suruhan_beruntun: p.suruhan,
  };
  const { pujian, saran } = pilihCadangan(ukuran);
  const isian = { sapaan, anak: "Raka", kata: "bebek", ukuran, kutipan: "" };
  const momen = suara[0] ? { t_mulai: Math.max(0, suara[0].t_mulai - 3), t_selesai: suara[0].t_mulai + 2 } : null;
  return {
    rekaman_id: rekamanId,
    mutu: { lolos: true, alasan: null, durasi_s: 58, kata_perekam: 52 },
    stt: { penyedia: "scribe", sumber_suara_anak: "label" },
    ajakan,
    suara_anak: suara,
    ukuran: { ...ukuran, perluasan_ai: Math.max(0, p.giliran - 1) },
    umpan_balik: {
      pujian_id: pujian.id,
      saran_id: saran.id,
      teks_pujian: isiTemplat(pujian, isian),
      teks_saran: isiTemplat(saran, isian),
      kutipan: "bebek mandi",
      versi_anak: "Bebek… mandi!",
      momen,
      sumber: "cadangan",
    },
    laporan_terapis: `Data contoh: jeda rata-rata ${String(ukuran.jeda_rata_s).replace(".", ",")} detik, ${p.giliran} giliran, ${suara.length} vokalisasi.`,
    naikkan_status: false,
  };
}

/**
 * Sisip massal. PostgREST menyamakan kolom semua baris dan mengisi kolom yang tidak ada dengan null,
 * jadi kolom bawaan diisi eksplisit lewat `bawaan` supaya tidak melanggar not null.
 */
async function sisip(db: SupabaseClient, tabel: string, baris: object | object[], bawaan: object = {}) {
  const isi = Array.isArray(baris) ? baris.map((b) => ({ ...bawaan, ...b })) : { ...bawaan, ...baris };
  const { error } = await db.from(tabel).insert(isi);
  if (error) throw new Error(`${tabel}: ${error.message}`);
}

/** Riwayat Raka: tiga minggu kalender (dua minggu lalu, minggu lalu, minggu ini). */
export async function riwayatRaka(db: SupabaseClient, nadiaId: string, itemRencana: string[]) {
  const s = hariSejakSenin();
  // Anggota bergabung tiga minggu lalu, bersamaan (bukan "perubahan baru").
  await db.from("anggota").update({ dibuat: waktu(s + 15, 9) }).eq("anak_id", ID_CONTOH.raka);

  // Rekaman Ibu Sari per minggu: jeda 2,1 → 3,0 → 3,8 detik; giliran 1 → 2 → 3.
  const profilMinggu: Profil[] = [
    { jeda: 2.1, giliran: 1, vokal: 2, suruhan: 2, kata_target: 3 },
    { jeda: 3.0, giliran: 2, vokal: 3, suruhan: 1, kata_target: 4 },
    { jeda: 3.8, giliran: 3, vokal: 4, suruhan: 0, kata_target: 5 },
  ];
  const rekaman: object[] = [];
  const hasil: object[] = [];
  const tambah = (anggota: string, hariLalu: number, p: Profil, sapaan: string) => {
    const id = crypto.randomUUID();
    rekaman.push({ id, id_lokal: `contoh-${id}`, anggota_id: anggota, anak_id: ID_CONTOH.raka, durasi_s: 58, status: "dinilai", rekaman_contoh: true, meta: {}, dibuat: waktu(hariLalu) });
    hasil.push({ rekaman_id: id, hasil: hasilContoh(id, p, sapaan) });
  };
  profilMinggu.forEach((p, w) => {
    const senin = s + (2 - w) * 7; // hari lalu untuk Senin minggu itu
    for (const geser of [0, 2, 4]) {
      const hariLalu = senin - geser;
      if (hariLalu >= 1) tambah(ID_CONTOH.ibuSari, hariLalu, { ...p, jeda: p.jeda + (geser - 2) * 0.05 }, "Ibu");
    }
  });
  // Mbak Sri merekam lebih jarang, jedanya sedikit lebih pendek.
  tambah(ID_CONTOH.mbakSri, s + 8, { jeda: 2.4, giliran: 1, vokal: 2, suruhan: 1, kata_target: 2 }, "Mbak Sri");
  tambah(ID_CONTOH.mbakSri, s + 3, { jeda: 3.1, giliran: 2, vokal: 3, suruhan: 0, kata_target: 3 }, "Mbak Sri");
  await sisip(db, "rekaman", rekaman);
  await sisip(db, "hasil_rekaman", hasil);
  // Satu rekaman ditolak karena TV.
  const tolak = crypto.randomUUID();
  await sisip(db, "rekaman", { id: tolak, id_lokal: `contoh-${tolak}`, anggota_id: ID_CONTOH.mbakSri, anak_id: ID_CONTOH.raka, durasi_s: 55, status: "ditolak", alasan_tolak: "Suara TV atau musik terlalu keras sehingga percakapan tertutup. Matikan TV atau musik dulu, lalu rekam lagi.", rekaman_contoh: true, meta: {}, dibuat: waktu(s + 10, 19) });

  // Catatan malam Ibu Sari: kata baru bertambah, lalu tiga hari terakhir lebih sedikit bersuara karena demam.
  const laporan: object[] = [];
  const catatan = (hariLalu: number, isi: { kata_baru?: string[]; catatan?: string; kondisi?: string; lebih_sedikit_bersuara?: boolean }) =>
    laporan.push({
      anggota_id: ID_CONTOH.ibuSari,
      anak_id: ID_CONTOH.raka,
      jenis: "catatan_malam",
      tanggal: tanggal(hariLalu),
      kata_baru: isi.kata_baru ?? [],
      kondisi: isi.kondisi ?? "sehat",
      regresi: false,
      lebih_sedikit_bersuara: !!isi.lebih_sedikit_bersuara,
      isi: { kata_baru: isi.kata_baru ?? [], catatan: isi.catatan ?? "", kondisi: isi.kondisi ?? "sehat", regresi: false, lebih_sedikit_bersuara: !!isi.lebih_sedikit_bersuara },
      dibuat: waktu(hariLalu, 20),
    });
  catatan(s + 13, { kata_baru: ["bek"], catatan: "Waktu mandi Raka bilang bek sambil menunjuk bebek." });
  catatan(s + 11, { catatan: "Main mobil di teras sama Mbak Sri." });
  catatan(s + 8, { kata_baru: ["mamam"], catatan: "Sebelum makan bilang mamam, dua kali." });
  catatan(s + 6, { catatan: "Menunggu sampai lima, Raka menatap lalu bersuara." });
  catatan(s + 4, { kata_baru: ["cing"], catatan: "Lihat kucing tetangga, bilang cing." });
  for (const h of [3, 2, 1]) catatan(h, { kondisi: "demam", lebih_sedikit_bersuara: true, catatan: "Badannya hangat, lebih banyak diam." });
  laporan.push({
    anggota_id: ID_CONTOH.mbakSri,
    anak_id: ID_CONTOH.raka,
    jenis: "ceritakan_sendiri",
    tanggal: tanggal(5),
    kata_baru: [],
    regresi: false,
    lebih_sedikit_bersuara: false,
    isi: { aktivitas_id: "MAIN-04", cerita: "Nyanyi cicak-cicak, berhenti sebelum 'hap'. Raka tertawa dan bilang 'ap'.", anak_bersuara: "sedikit" },
    dibuat: waktu(5, 15),
  });
  await sisip(db, "laporan_keluarga", laporan, BAWAAN_LAPORAN);

  // Log aktivitas minggu ini (hari aktif) pada rencana yang berlaku.
  const log: object[] = [];
  for (let h = Math.min(s, 6); h >= 1; h--) {
    log.push({ anggota_id: ID_CONTOH.ibuSari, rencana_item_id: itemRencana[0], tanggal: tanggal(h), selesai: true });
    if (h % 2 === 0) log.push({ anggota_id: ID_CONTOH.mbakSri, rencana_item_id: itemRencana[2], tanggal: tanggal(h), selesai: true });
  }
  if (log.length) await sisip(db, "log_aktivitas", log);

  // Sesi minggu lalu, pesan, dan status sekarang (dipicu lebih sedikit bersuara tiga hari).
  await sisip(db, "catatan_sesi", { anak_id: ID_CONTOH.raka, terapis_id: nadiaId, tanggal: tanggal(7), isi: "Raka mulai bersuara saat ditunggu. Lanjut strategi menunggu.", kata_baru_dikonfirmasi: ["bek", "mamam"], dibuat: waktu(7, 11) });
  await sisip(db, "pesan", [
    { anak_id: ID_CONTOH.raka, pengirim_terapis: null, pengirim_anggota: ID_CONTOH.ibuSari, isi: "Kak, Raka tiga hari ini demam dan lebih banyak diam. Latihannya tetap jalan?", konteks: `Catatan malam ${tanggal(2)}`, dibuat: waktu(2, 20) },
    { anak_id: ID_CONTOH.raka, pengirim_anggota: null, konteks: null, pengirim_terapis: nadiaId, isi: "Tetap jalan semampunya, Bu. Kalau Raka belum mau, cukup Ceritakan sendiri saja.", dibuat: waktu(1, 9) },
  ]);
  const pemicu = "Anak dilaporkan lebih sedikit bersuara tiga hari berturut-turut";
  await db.from("anak").update({ status: "terapis_meninjau", status_pemicu: pemicu, status_sejak: waktu(1, 21) }).eq("id", ID_CONTOH.raka);
  await sisip(db, "riwayat_status", { anak_id: ID_CONTOH.raka, status: "terapis_meninjau", pemicu, waktu: waktu(1, 21) });
}

/** Anak contoh selain Raka. Sembilan cukup untuk demo: empat kasus status khusus dan lima yang lanjut. */
export const ANAK_LAIN = ["Alya", "Bima", "Citra", "Dafa", "Elsa", "Gita", "Hana", "Mika", "Salsa"];
const NAMA = ANAK_LAIN;
const KATA = [["bola", "mau", "lagi", "buka", "susu"], ["mobil", "jalan", "mau", "lagi", "tutup"], ["kucing", "mamam", "minum", "mau", "lagi"]];

/** 9 anak lain milik Kak Nadia dengan status bervariasi, total 10 anak contoh di D3. */
export async function anakLain(db: SupabaseClient, nadiaId: string) {
  const anak: object[] = [];
  const anggota: object[] = [];
  const laporan: object[] = [];
  const status: object[] = [];
  NAMA.forEach((nama, i) => {
    const id = crypto.randomUUID();
    const ibu = crypto.randomUUID();
    const kasus =
      nama === "Alya"
        ? { status: "bahas_minggu_ini", pemicu: "Regresi dilaporkan keluarga" }
        : nama === "Bima"
          ? { status: "terapis_meninjau", pemicu: "Keluarga tidak aktif 5 hari" }
          : nama === "Citra"
            ? { status: "terapis_meninjau", pemicu: "Pendengaran belum diperiksa" }
            : nama === "Dafa"
              ? { status: "terapis_meninjau", pemicu: "Rekaman ditolak tiga kali berturut-turut" }
              : { status: "lanjut", pemicu: null };
    anak.push({
      id,
      klinik_id: ID_CONTOH.klinik,
      terapis_id: nadiaId,
      nama,
      tanggal_lahir: tanggal(30 * (20 + ((i * 7) % 26))),
      pendengaran: nama === "Citra" ? "belum_diperiksa" : "normal",
      tahap: 1 + (i % 3),
      strategi_fokus: ["Menunggu", "Mencontohkan", "Memperluas"][i % 3],
      kata_target: KATA[i % 3],
      hari_sesi: 1 + (i % 6),
      jam_sesi: `${String(8 + (i % 5)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
      status: kasus.status,
      status_pemicu: kasus.pemicu,
      data_contoh: true,
    });
    anggota.push({ id: ibu, anak_id: id, nama: `Ibu ${nama}`, peran: "ibu", pengelola_keluarga: true, izin_nilai: true, dibuat: waktu(30, 9) });
    status.push({ anak_id: id, status: kasus.status, pemicu: kasus.pemicu ?? "Program baru" });
    // Hari aktif bervariasi: Bima tidak aktif 5 hari terakhir.
    const aktif = nama === "Bima" ? [6] : Array.from({ length: (i * 5) % 7 }, (_, k) => k + 1);
    for (const h of aktif) {
      laporan.push({ anggota_id: ibu, anak_id: id, jenis: "catatan_malam", tanggal: tanggal(h), kata_baru: [], isi: { kata_baru: [], catatan: "", kondisi: "sehat", regresi: false, lebih_sedikit_bersuara: false } });
    }
    if (nama === "Alya") {
      const kutipan = "Dulu sudah bisa bilang 'bola', sekarang tidak mau lagi.";
      laporan.push({ anggota_id: ibu, anak_id: id, jenis: "catatan_malam", tanggal: tanggal(1), kata_baru: [], regresi: true, isi: { kata_baru: [], catatan: kutipan, kondisi: "sehat", regresi: true, lebih_sedikit_bersuara: false } });
    }
  });
  await sisip(db, "anak", anak);
  await sisip(db, "anggota", anggota);
  await sisip(db, "riwayat_status", status);
  await sisip(db, "laporan_keluarga", laporan, BAWAAN_LAPORAN);
}

/** Hari sesi Raka = besok (1 = Senin … 7 = Minggu), supaya Raka selalu tampil di D3 saat demo. */
export function hariSesiBesok() {
  const besok = new Date(Date.now() + WIB + HARI).getUTCDay();
  return besok === 0 ? 7 : besok;
}
