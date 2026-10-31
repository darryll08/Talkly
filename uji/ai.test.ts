import assert from "node:assert/strict";
import { test } from "node:test";
import { nilaiRekaman, type MasukanNilai } from "../lib/ai/nilai";
import { buatPeta, samarkan } from "../lib/ai/samaran";
import { tentukanPeran } from "../lib/ukur/pembicara";
import { keUcapan } from "../lib/ukur/stt";
import { ukur } from "../lib/ukur/ukur";
import { pengisi, transkrip } from "./data/bantu-transkrip";

const KATA = ["bebek", "mamam", "lagi", "mau", "buka"];

function masukan(): MasukanNilai {
  const ucapan = keUcapan(
    transkrip([
      ["ibu", 1, 2.5, "Raka lihat ini bebek"],
      ["ibu", 3, 4, "bebek?"],
      ["anak", 8.8, 9.3, "bek"],
      ["ibu", 10, 11.5, "iya bebek mandi"],
      ...pengisi(14, 58),
    ]),
  );
  const peran = tentukanPeran(ucapan);
  const hasil = ukur({ ucapan, peran, kata_target: KATA, durasi_s: 60, mulai_menunggu_s: [], ukuran_nonaktif: [] });
  return {
    ucapan,
    perekam: peran.perekam,
    suara_anak: peran.suara_anak,
    ukur: hasil,
    anak: { nama: "Raka", tahap: 1, kata_target: KATA },
    nama_anggota: [{ nama: "Ibu Sari", peran: "ibu" }],
    sapaan: "Ibu",
  };
}

const sah = {
  pujian_id: "P03",
  saran_id: "S09",
  kutipan: "iya bebek mandi",
  versi_anak: "Bebek… mandi!",
  perluasan_ai: 1,
  laporan_terapis: "Perekam menunggu sekitar lima detik sebelum adik bersuara, lalu memperluas ucapannya.",
  ragu: false,
};

test("keluaran AI yang sah dipakai, kutipan diisi ke templat, nama anak dikembalikan", async () => {
  const h = await nilaiRekaman(masukan(), async () => sah);
  assert.equal(h.umpan_balik.sumber, "ai");
  assert.equal(h.naikkan_status, false);
  assert.match(h.umpan_balik.teks_pujian, /"iya bebek mandi"/);
  assert.match(h.umpan_balik.teks_pujian, /Raka/);
  assert.match(h.laporan_terapis, /Raka/);
  assert.ok(h.umpan_balik.momen, "momen dari pengukuran ikut");
});

test("kutipan yang tidak ada di transkrip → templat cadangan dan status naik", async () => {
  const h = await nilaiRekaman(masukan(), async () => ({ ...sah, kutipan: "bebeknya lucu sekali ya nak" }));
  assert.equal(h.umpan_balik.sumber, "cadangan");
  assert.equal(h.naikkan_status, true);
  assert.ok(h.catatan.some((c) => c.includes("kutipan")));
  assert.doesNotMatch(h.umpan_balik.teks_pujian, /\{|\}/);
});

test("batas waktu AI → templat cadangan", async () => {
  const h = await nilaiRekaman(masukan(), async () => {
    throw new Error("Request timed out.");
  });
  assert.equal(h.umpan_balik.sumber, "cadangan");
  assert.equal(h.naikkan_status, true);
});

test("AI ragu → templat cadangan", async () => {
  const h = await nilaiRekaman(masukan(), async () => ({ ...sah, ragu: true }));
  assert.equal(h.umpan_balik.sumber, "cadangan");
});

test("versi anak tahap 1 lebih dari 2 kata atau bertanda tanya ditolak", async () => {
  for (const versi_anak of ["Raka mau main bebek sekarang", "Bebek?", "Ayo bilang bebek"]) {
    const h = await nilaiRekaman(masukan(), async () => ({ ...sah, versi_anak }));
    assert.equal(h.umpan_balik.sumber, "cadangan", versi_anak);
  }
});

test("ID templat di luar kandidat ditolak", async () => {
  const h = await nilaiRekaman(masukan(), async () => ({ ...sah, pujian_id: "P99" }));
  assert.equal(h.umpan_balik.sumber, "cadangan");
});

test("kata diagnosis di laporan terapis ditolak", async () => {
  const h = await nilaiRekaman(masukan(), async () => ({ ...sah, laporan_terapis: "Kemungkinan autis." }));
  assert.equal(h.umpan_balik.sumber, "cadangan");
});

test("nama anak dan anggota disamarkan sebelum dikirim ke AI", async () => {
  let terkirim = "";
  await nilaiRekaman(masukan(), async (input) => {
    terkirim = input;
    return sah;
  });
  assert.doesNotMatch(terkirim, /Raka|Sari/);
  assert.match(terkirim, /adik/);
  assert.equal(samarkan("Ibu Sari bilang Sari capek, Raka main", buatPeta({ anak: "Raka", anggota: [{ nama: "Ibu Sari", peran: "ibu" }] })), "ibu bilang ibu capek, adik main");
});
