import assert from "node:assert/strict";
import { test } from "node:test";
import { API, type NamaEndpoint } from "../api";
import { ID, CONTOH_ORTU } from "./ortu";
import { CONTOH_TERAPIS, CONTOH_MINGGU_INI, CONTOH_ANAK_NAMA_PANJANG } from "./terapis";

test("semua contoh D mengikuti kontrak resmi", () => {
  for (const [nama, contoh] of Object.entries(CONTOH_TERAPIS)) {
    const endpoint = API[nama as NamaEndpoint];
    assert.ok("response" in endpoint);
    endpoint.response.parse(contoh);
  }
  API.anakLihat.response.parse(CONTOH_ANAK_NAMA_PANJANG);
});

test("contoh dasbor dan orang tua menunjuk keluarga dan hasil rekaman yang sama", () => {
  const kartu = CONTOH_TERAPIS.anakKartu;
  assert.equal(kartu.anak.id, ID.raka);
  assert.equal(kartu.anak.terapis.id, ID.nadia);
  assert.equal(kartu.rekaman_terpilih.id, CONTOH_ORTU.rekamanLihat.id);
  assert.deepEqual(kartu.rekaman_terpilih.ajakan, CONTOH_ORTU.rekamanLihat.hasil!.ajakan);
  assert.equal(kartu.strategi.jeda_rata_s.nilai, CONTOH_ORTU.kemajuan.strategi.jeda_rata_s.nilai);
});

test("ringkasan 25 anak cocok dengan daftar dan prioritas status", () => {
  const anak = CONTOH_MINGGU_INI.hari.flatMap((h) => h.anak);
  assert.equal(anak.length, 25);
  assert.equal(new Set(anak.map((a) => a.id)).size, 25);
  assert.equal(anak.filter((a) => a.status === "bahas_minggu_ini").length, CONTOH_MINGGU_INI.ringkasan.bahas);
  assert.equal(anak.filter((a) => a.status === "terapis_meninjau").length, CONTOH_MINGGU_INI.ringkasan.meninjau);
  assert.equal(anak[0].nama, "Alya");
});
