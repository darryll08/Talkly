import type { NamaEndpoint, ResponseDari } from "../api";

// Kontrak 2.5: satu contoh response per endpoint, wajib lolos skemanya (uji/kontrak.test.ts).
// B menulis contoh untuk endpoint yang dipakai layar O dan beranda, C untuk endpoint yang hanya dipakai layar D.
// Tambahkan di file terpisah per pemilik lalu gabungkan di sini, misalnya `...CONTOH_ORTU, ...CONTOH_TERAPIS`.

export const CONTOH: { [N in NamaEndpoint]?: ResponseDari<N> } = {};
