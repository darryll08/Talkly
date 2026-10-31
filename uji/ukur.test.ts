import assert from "node:assert/strict";
import { test } from "node:test";
import { periksaMutu } from "../lib/ukur/mutu";
import { tentukanPeran } from "../lib/ukur/pembicara";
import { adalahPerluasan } from "../lib/ukur/perluasan";
import { keUcapan } from "../lib/ukur/stt";
import { ukur } from "../lib/ukur/ukur";
import { pengisi, transkrip, type Baris } from "./data/bantu-transkrip";

const KATA = ["bebek", "mamam", "lagi", "mau", "buka"];

function jalankan(baris: Baris[], opsi: { durasi?: number; tombol?: number[]; nonaktif?: string[] } = {}) {
  const t = transkrip(baris);
  const ucapan = keUcapan(t);
  const peran = tentukanPeran(ucapan);
  return {
    peran,
    hasil: ukur({
      ucapan,
      peran,
      kata_target: KATA,
      durasi_s: opsi.durasi ?? 60,
      mulai_menunggu_s: opsi.tombol ?? [],
      ukuran_nonaktif: opsi.nonaktif ?? [],
    }),
  };
}

// --- A3.5 ---------------------------------------------------------------

test("menunggu 4,8 detik lalu anak bersuara dan ibu menanggapi = satu giliran", () => {
  const { hasil } = jalankan([
    ["ibu", 1, 2.5, "Raka mau apa?"],
    ["ibu", 3, 4, "ini bebek"],
    ["ibu", 5, 6, "bebek?"],
    ["anak", 10.8, 11.3, "bek"],
    ["ibu", 12, 13.5, "iya bebek mandi"],
    ...pengisi(20, 58),
  ]);
  const a = hasil.ajakan.find((x) => x.teks === "bebek?")!;
  assert.equal(a.kategori, "anak_merespons");
  assert.equal(a.jeda_s, 4.8);
  assert.equal(hasil.ukuran.giliran, 1);
  assert.ok(hasil.momen, "momen anak terisi");
  assert.ok(hasil.momen!.t_mulai <= 10.8 && hasil.momen!.t_selesai >= 11.3);
});

test("tiga kali ayo bilang berturut-turut = satu suruhan beruntun", () => {
  const { hasil } = jalankan([
    ["ibu", 1, 2, "ini bebek"],
    ["ibu", 2.4, 3.4, "ayo bilang bebek"],
    ["ibu", 4, 5, "ayo bilang bebek"],
    ["ibu", 5.6, 6.6, "ayo bilang dong"],
    ...pengisi(10, 58),
  ]);
  assert.equal(hasil.ukuran.suruhan_beruntun, 1);
});

test("suruhan beruntun tidak dihitung bila dinonaktifkan terapis", () => {
  const { hasil } = jalankan(
    [["ibu", 1, 2, "ayo bilang bebek"], ["ibu", 2.5, 3.5, "ayo bilang bebek"], ...pengisi(10, 58)],
    { nonaktif: ["suruhan_beruntun"] },
  );
  assert.equal(hasil.ukuran.suruhan_beruntun, 0);
});

test("bertanya lalu bicara lagi 1,2 detik kemudian = memotong", () => {
  const { hasil } = jalankan([["ibu", 1, 2, "mau mamam?"], ["ibu", 3.2, 4.2, "ini mamam enak"], ...pengisi(10, 58)]);
  const a = hasil.ajakan.find((x) => x.teks === "mau mamam?")!;
  assert.equal(a.kategori, "memotong");
  assert.equal(a.jeda_s, 1.2);
});

test("hening ≥ 4 detik tanpa suara anak = menunggu cukup", () => {
  const { hasil } = jalankan([["ibu", 1, 2, "buka?"], ["ibu", 7, 8, "ayo kita buka"], ...pengisi(10, 58)]);
  assert.equal(hasil.ajakan.find((x) => x.teks === "buka?")!.kategori, "menunggu_cukup");
});

test("tombol 'saya mulai menunggu' menjadi awal jeda", () => {
  const { hasil } = jalankan([["ibu", 1, 2, "ini bebek"], ["ibu", 8, 9, "bebek mandi"], ...pengisi(12, 58)], { tombol: [3] });
  const a = hasil.ajakan.find((x) => x.teks === "ini bebek")!;
  assert.equal(a.jeda_s, 5);
});

test("ajakan yang disela dewasa lain sebelum ambang tidak dinilai", () => {
  const { hasil } = jalankan([
    ["ibu", 1, 2, "mau apa?"],
    ["ayah", 2.5, 6, "Raka tadi sudah makan belum ya bu soalnya tadi siang rewel"],
    ...pengisi(10, 58),
  ]);
  assert.equal(hasil.ajakan.find((x) => x.teks === "mau apa?"), undefined);
});

test("pertanyaan beruntun dihitung satu kali per runtun", () => {
  const { hasil } = jalankan([
    ["ibu", 1, 2, "ini apa?"],
    ["ibu", 2.3, 3, "apa ini?"],
    ["ibu", 3.3, 4, "warnanya apa?"],
    ...pengisi(10, 58),
  ]);
  assert.equal(hasil.ukuran.pertanyaan_beruntun, 1);
});

// --- A3.4 ---------------------------------------------------------------

test("perekam = pembicara dengan ucapan terbanyak, walau dewasa lain lebih banyak kata", () => {
  const { peran } = jalankan([
    ["ibu", 1, 2, "bebek?"],
    ["ibu", 4, 5, "mandi?"],
    ["ibu", 8, 9, "lagi?"],
    ["ibu", 12, 13, "mau?"],
    ["ayah", 20, 30, "jadi tadi itu Raka sudah main bebek dari pagi sampai siang terus tidur sebentar lalu bangun lagi"],
    ["ayah", 32, 40, "nanti sore kita ajak ke taman saja biar dia bisa lihat bebek yang asli di kolam"],
  ]);
  assert.equal(peran.perekam, "ibu");
  assert.deepEqual(peran.dewasa_lain, ["ayah"]);
  assert.deepEqual(peran.anak, []);
});

test("dewasa lain yang bicara panjang tidak dihitung sebagai suara anak", () => {
  const { peran } = jalankan([
    ["ibu", 1, 2, "bebek?"],
    ["ibu", 4, 5, "mandi?"],
    ["ibu", 8, 9, "lagi?"],
    ["anak", 2.5, 3, "bek"],
    ["anak", 6, 6.4, "di"],
    ["ayah", 20, 30, "jadi tadi itu Raka sudah main bebek dari pagi sampai siang terus tidur"],
  ]);
  assert.deepEqual(peran.anak, ["anak"]);
  assert.equal(peran.suara_anak.length, 2);
  assert.equal(peran.sumber_suara_anak, "label");
});

test("jejak nada ponsel dipakai bila label anak tidak ada, hanya di celah hening", () => {
  const ucapan = keUcapan(transkrip([["ibu", 1, 2, "bebek?"], ["ibu", 8, 9, "iya bebek"]]));
  const peran = tentukanPeran(ucapan, [
    { t_mulai: 4, t_selesai: 4.5, f0_rata: 340 }, // di celah hening → dipakai
    { t_mulai: 1.2, t_selesai: 1.6, f0_rata: 320 }, // bertumpuk dengan ibu → diabaikan
  ]);
  assert.equal(peran.sumber_suara_anak, "celah_hening");
  assert.deepEqual(peran.suara_anak, [{ t_mulai: 4, t_selesai: 4.5 }]);
});

// --- A3.3 ---------------------------------------------------------------

const ucapanCukup = keUcapan(transkrip(pengisi(0, 58)));

test("mutu: rekaman 25 detik ditolak dengan alasan durasi", () => {
  const m = periksaMutu({ durasi_s: 25, terputus: false, ucapan: ucapanCukup, perekam: "ibu", peristiwa: [] });
  assert.equal(m.lolos, false);
  assert.match(m.alasan!, /25 detik/);
});

test("mutu: rekaman sepi ditolak dengan jumlah kata", () => {
  const sepi = keUcapan(transkrip([["ibu", 1, 3, "bebek ya"], ["ibu", 20, 22, "mandi yuk"]]));
  const m = periksaMutu({ durasi_s: 60, terputus: false, ucapan: sepi, perekam: "ibu", peristiwa: [] });
  assert.equal(m.lolos, false);
  assert.match(m.alasan!, /4 kata/);
});

test("mutu: rekaman terputus ditolak", () => {
  const m = periksaMutu({ durasi_s: 60, terputus: true, ucapan: ucapanCukup, perekam: "ibu", peristiwa: [] });
  assert.equal(m.lolos, false);
  assert.match(m.alasan!, /layar/);
});

test("mutu: TV atau musik ≥ 30% durasi ditolak", () => {
  const m = periksaMutu({
    durasi_s: 60,
    terputus: false,
    ucapan: ucapanCukup,
    perekam: "ibu",
    peristiwa: [{ jenis: "musik", t_mulai: 0, t_selesai: 25 }],
  });
  assert.equal(m.lolos, false);
  assert.match(m.alasan!, /TV atau musik/);
});

// Ucapan dengan sela panjang di antaranya, dan jejak level: bicara -15 dBFS, sela sesuai parameter.
const ucapanBersela = keUcapan(
  transkrip([0, 1, 2, 3, 4].map((i) => ["ibu", 2 + i * 10, 5 + i * 10, "bebek mandi yuk sini ya"] as [string, number, number, string])),
);
const jejakDengan = (selaDb: number): [number, number, number][] =>
  Array.from({ length: 1200 }, (_, i) => {
    const t = (i + 1) * 0.05;
    return [t, ucapanBersela.some((u) => t >= u.t_mulai && t <= u.t_selesai) ? -15 : selaDb, 0];
  });

test("mutu: TV keras yang tidak ditandai STT ditolak dari jejak level ponsel", () => {
  const m = periksaMutu({ durasi_s: 60, terputus: false, ucapan: ucapanBersela, perekam: "ibu", peristiwa: [], jejak: jejakDengan(-19) });
  assert.equal(m.lolos, false);
  assert.match(m.alasan!, /TV atau musik/);
});

test("mutu: ruangan tenang dengan jejak level tetap lolos", () => {
  const m = periksaMutu({ durasi_s: 60, terputus: false, ucapan: ucapanBersela, perekam: "ibu", peristiwa: [], jejak: jejakDengan(-40) });
  assert.equal(m.lolos, true);
});

test("mutu: rekaman cukup lolos", () => {
  const m = periksaMutu({ durasi_s: 60, terputus: false, ucapan: ucapanCukup, perekam: "ibu", peristiwa: [] });
  assert.equal(m.lolos, true);
  assert.equal(m.alasan, null);
});

// --- perluasan --------------------------------------------------------------

test("perluasan: ulang kata anak lalu pakai lagi dalam frasa lebih panjang", () => {
  assert.equal(adalahPerluasan("bek", "Bebek. Bebek kuning."), true);
  assert.equal(adalahPerluasan("Bek.", "Iya bebek, bebek mandi. Bebek kan mau berenang."), true);
  assert.equal(adalahPerluasan("mam", "Iyo mamam, mamam sego. Sego karo endok."), true);
  assert.equal(adalahPerluasan("andi", "Mandi. Mandi di ember."), true);
});

test("perluasan: hanya mengulang atau kalimat sesudahnya tanpa kata anak tidak dihitung", () => {
  assert.equal(adalahPerluasan("agi", "Lagi."), false);
  assert.equal(adalahPerluasan("au", "Mau. Nih bebeknya."), false);
  assert.equal(adalahPerluasan("uka", "Buka. Wis kebuka. Ngombe."), false);
  assert.equal(adalahPerluasan("eh", "Penuh ya. Ember penuh air."), false);
});

test("pembicara: satu ucapan panjang yang salah label tidak membuat anak jadi dewasa (median)", () => {
  const u = keUcapan(
    transkrip([
      ["ibu", 1, 3, "ini bebek mandi ya"],
      ["anak", 4, 4.4, "andi"],
      ["ibu", 5, 7, "mandi bebeknya mandi"],
      ["anak", 9, 9.4, "uk"],
      ["ibu", 10, 12, "masuk plung ya"],
      ["anak", 14, 17, "udah wangi sebentar lagi selesai ya tinggal bilas"],
      ["ibu", 18, 20, "gosok perutnya ya"],
    ]),
  );
  assert.deepEqual(tentukanPeran(u).anak, ["anak"]);
});
