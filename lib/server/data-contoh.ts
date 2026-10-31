// ID tetap data contoh. Dipakai seed (supabase/seed.ts) dan mode demo (POST /api/demo).

export const ID_CONTOH = {
  klinik: "11111111-1111-4111-8111-111111111111",
  raka: "22222222-2222-4222-8222-222222222222",
  ibuSari: "33333333-3333-4333-8333-333333333333",
  mbakSri: "44444444-4444-4444-8444-444444444444",
  // Keluarga Uji B hanya di TALKLY-DEV, untuk uji akses lintas keluarga (K8)
  nara: "55555555-5555-4555-8555-555555555555",
  ibuNara: "66666666-6666-4666-8666-666666666666",
} as const;

export const EMAIL_TERAPIS_CONTOH = {
  nadia: "kak.nadia@contoh.talkly.id",
  // terapis kedua hanya di TALKLY-DEV, untuk uji 403
  uji: "kak.uji@contoh.talkly.id",
} as const;
