# Talkly

PWA dari klinik untuk orang tua anak terlambat bicara (18–48 bulan). Orang tua merekam 1 menit rutinitas di rumah, sistem mengukur jeda menunggu dan giliran percakapan, lalu hasilnya menjadi umpan balik untuk orang tua dan kartu anak untuk terapis. Anak tidak memakai layar.

Tim Boomerang, Universitas Airlangga · INCEPTION 2026 · Subtema 2: Health, Well-being, and Accessibility.

> Kerangka README. Diisi bertahap di setiap titik integrasi (pemegang: Darryl).

## Menjalankan

```bash
npm ci
npx vercel env pull .env.local
npm run dev
```

`npm run periksa` menjalankan cek tipe, lint, tes, dan build.

## Folder dan pemilik

| Pemilik | Folder |
|---|---|
| Darryl Sitia (A) | `app/api/`, `lib/server/`, `lib/ukur/`, `lib/ai/`, `lib/status/`, `lib/keluarga/`, `lib/terapis/`, `supabase/`, `data/`, `uji/`, `scripts/`, `.github/workflows/`, `vercel.json`, `.env.example`, `package.json`, `README.md` |
| I Wayan Satya Dharma Sadhana (B) | `app/(ortu)/`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/manifest.ts`, `app/offline/`, `app/dev/`, `components/` (kecuali `components/terapis/`), `public/`, `lib/perangkat/`, `lib/gaya.ts` |
| Aditya Saputra (C) | `app/(terapis)/`, `components/terapis/` |
| Bersama | `lib/kontrak/` |

## Fitur

## Teknologi

## Kontribusi anggota

### Darryl Sitia

### I Wayan Satya Dharma Sadhana

### Aditya Saputra

## Bahan persiapan

## Penyesuaian terhadap Challenge Brief

Tidak ada perubahan lingkup; Talkly diajukan di subtema 2.

## AI Use Declaration

## Third-Party Declaration

## Hasil uji akurasi
