import assert from "node:assert/strict";
import { test } from "node:test";
import { endpointPushResmi } from "../lib/keluarga/push-resmi";
import { langkahPercobaan, MAKS_PERCOBAAN_PROSES } from "../lib/ukur/proses";

// Perbaikan finalist-release: batas percobaan proses rekaman dan alamat langganan Web Push.

test("percobaan proses dihitung saat mulai, jatah habis setelah MAKS kali dimulai", () => {
  assert.deepEqual(langkahPercobaan({}), { percobaan: 1, habis: false });
  assert.deepEqual(langkahPercobaan({ percobaan_proses: 1 }), { percobaan: 2, habis: false });
  assert.deepEqual(langkahPercobaan({ percobaan_proses: MAKS_PERCOBAAN_PROSES - 1 }), { percobaan: MAKS_PERCOBAAN_PROSES, habis: false });
  // Tiga proses yang dimatikan di tengah jalan tetap terhitung: klaim keempat tidak memproses lagi.
  assert.equal(langkahPercobaan({ percobaan_proses: MAKS_PERCOBAAN_PROSES }).habis, true);
  assert.equal(langkahPercobaan({ percobaan_proses: "x" }).percobaan, 1);
});

test("rekaman yang terus dimatikan berhenti setelah MAKS percobaan", () => {
  let meta: Record<string, unknown> = {};
  let dimulai = 0;
  for (let klaim = 0; klaim < 10; klaim++) {
    const l = langkahPercobaan(meta);
    if (l.habis) break;
    dimulai++;
    meta = { ...meta, percobaan_proses: l.percobaan }; // lalu proses mati tanpa catch
  }
  assert.equal(dimulai, MAKS_PERCOBAAN_PROSES);
});

test("alamat push hanya dari layanan resmi", () => {
  for (const ok of [
    "https://fcm.googleapis.com/fcm/send/abc:def",
    "https://updates.push.services.mozilla.com/wpush/v2/gAAA",
    "https://web.push.apple.com/QGx1",
    "https://wns2-sg2p.notify.windows.com/w/?token=AQ",
  ]) {
    assert.equal(endpointPushResmi(ok), true, ok);
  }
  for (const tolak of [
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://fcm.googleapis.com:8443/fcm/send/abc",
    "https://contoh.com/fcm.googleapis.com",
    "https://fcm.googleapis.com.contoh.com/x",
    "https://evilfcm.googleapis.com.attacker.io/x",
    "https://169.254.169.254/latest/meta-data",
    "https://localhost/x",
    "bukan url",
  ]) {
    assert.equal(endpointPushResmi(tolak), false, tolak);
  }
});
