import type { ResponseDari } from "../api";

// Contoh response layar admin A1 (B). Angka mengikuti seed: satu klinik contoh, Kak Nadia dengan 25 anak.

const KLINIK = "11111111-1111-4111-8111-111111111111";
const KLINIK_BARU = "77777777-7777-4777-8777-777777777777";

export const CONTOH_ADMIN = {
  adminRingkasan: {
    admin: { nama: "Admin Talkly", email: "admin@contoh.talkly.id" },
    total: { klinik: 2, terapis: 2, anak: 26, keluarga: 25 },
    klinik: [
      { id: KLINIK, nama: "Klinik Tumbuh Kembang Contoh", data_contoh: true, terapis: 1, anak: 25 },
      { id: KLINIK_BARU, nama: "Klinik Wicara Ceria", data_contoh: false, terapis: 1, anak: 1 },
    ],
    terapis: [
      {
        id: "88888888-8888-4888-8888-888888888888",
        nama: "Kak Dimas",
        email: "dimas@wicaraceria.id",
        klinik_id: KLINIK_BARU,
        klinik: "Klinik Wicara Ceria",
        anak: 1,
        data_contoh: false,
        dibuat: "2026-10-31T09:00:00+07:00",
      },
      {
        id: "13514388-14ae-40e6-b67b-9e145398137f",
        nama: "Kak Nadia",
        email: "kak.nadia@contoh.talkly.id",
        klinik_id: KLINIK,
        klinik: "Klinik Tumbuh Kembang Contoh",
        anak: 25,
        data_contoh: true,
        dibuat: "2026-10-10T09:00:00+07:00",
      },
    ],
  },
  adminTerapisBuat: { id: "99999999-9999-4999-8999-999999999999" },
} satisfies { adminRingkasan: ResponseDari<"adminRingkasan">; adminTerapisBuat: ResponseDari<"adminTerapisBuat"> };
