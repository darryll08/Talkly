# Talkly

PWA dari klinik untuk orang tua anak terlambat bicara (18–48 bulan). Orang tua merekam 1 menit rutinitas di rumah, sistem mengukur jeda menunggu dan giliran percakapan, lalu hasilnya menjadi umpan balik untuk orang tua dan kartu anak untuk terapis. Anak tidak memakai layar.

Tim Boomerang, Universitas Airlangga · INCEPTION 2026 · Subtema 2: Health, Well-being, and Accessibility.

> README diisi bertahap di setiap titik integrasi (pemegang: Darryl).

- Aplikasi daring: https://talkly-orcin.vercel.app (mode demo di beranda)
- Repositori: https://github.com/darryll08/Talkly
- Video demo: menyusul
- Pitch deck: menyusul

## Menjalankan

```bash
npm ci
npx vercel env pull .env.local
npm run dev
```

- `npm run periksa`: cek tipe, lint, tes, dan build. Wajib hijau sebelum push.
- `UJI_URL=http://localhost:3000 npm run uji`: menjalankan juga penjaga akses terhadap server lokal.
- `bash scripts/asap.sh <URL>`: cek cepat URL produksi (halaman, tes sambungan, mode demo, endpoint GET, penjaga akses).

Deploy produksi berjalan otomatis lewat GitHub Actions (`.github/workflows/deploy.yml`) untuk setiap push ke `main`, setelah `npm run periksa` hijau.

## Arsitektur

```
Ponsel orang tua (PWA)                       Dasbor terapis (web)
  MediaRecorder + jejak nada (AudioWorklet)      │
        │  POST /api/rekaman (audio + meta)      │  GET /api/anak/:id/kartu, /api/minggu-ini
        ▼                                        ▼
  app/api  ── lib/server (sesi HMAC, denganAkses, dbKeluarga)
        │
        ├─ lib/ukur   STT: ElevenLabs Scribe v2 → cadangan Deepgram Nova-3
        │             mutu → perekam & suara anak → ajakan, jeda, giliran (kode, bukan AI)
        ├─ lib/ai     GPT-6 Luna, satu panggilan per rekaman: memilih templat terapis,
        │             nama disamarkan, keluaran divalidasi, gagal → templat cadangan
        ├─ lib/status aturan status Tabel 2 (AI tidak bisa menurunkan status)
        ▼
  Supabase (Postgres + Storage privat + RLS), region Singapura
```

Kontrak data antarbagian ada di `lib/kontrak/`: daftar endpoint (`api.ts`), hasil rekaman (`hasil.ts`), meta unggah (`rekaman.ts`), laporan keluarga (`laporan.ts`), dan matriks layar → endpoint (`layar.ts`). Layar hanya memanggil `/api` lewat `panggil()` yang memvalidasi kedua arah.

Kode layar mengikuti proposal v19: **D5 = Setelah sesi, D6 = Pesan keluarga**. Di proposal v20 yang dikirim, keduanya tertukar (D5 = Pesan keluarga, D6 = Setelah sesi).

## Folder dan pemilik

| Pemilik | Folder |
|---|---|
| Darryl Sitia (A) | `app/api/`, `lib/server/`, `lib/ukur/`, `lib/ai/`, `lib/status/`, `lib/keluarga/`, `lib/terapis/`, `supabase/`, `data/`, `uji/`, `scripts/`, `.github/workflows/`, `vercel.json`, `.env.example`, `package.json`, `README.md` |
| I Wayan Satya Dharma Sadhana (B) | `app/(ortu)/`, `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/manifest.ts`, `app/offline/`, `app/dev/`, `components/` (kecuali `components/terapis/`), `public/`, `lib/perangkat/`, `lib/gaya.ts` |
| Aditya Saputra (C) | `app/(terapis)/`, `components/terapis/` |
| Bersama | `lib/kontrak/` |

## Fitur

## Teknologi

| Bagian | Pilihan |
|---|---|
| Aplikasi | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, PWA |
| Data | Supabase: Postgres, Storage privat, Row Level Security, Auth (terapis) |
| Login keluarga | Kode undangan (SHA-256, 7 hari) dan kode masuk pribadi (bcrypt), cookie HMAC |
| Speech-to-text | ElevenLabs Scribe v2, cadangan Deepgram Nova-3 |
| Model bahasa | OpenAI GPT-6 Luna, keluaran JSON terstruktur yang divalidasi server |
| Notifikasi | Web Push (VAPID) |
| Hosting | Vercel (region `sin1`), cron harian untuk pengingat dan penghapusan audio |

## Kontribusi anggota

### Darryl Sitia

### I Wayan Satya Dharma Sadhana

### Aditya Saputra

Menyiapkan layout dasbor terapis dan navigasi anak, form masuk terapis, daftar Minggu ini (D3), serta kartu anak (D4) dengan rentang strategi, pita percakapan, hasil per pengasuh, dan panel laporan keluarga terpisah. Contoh respons D memakai kontrak resmi dan ID keluarga yang sama dengan layar orang tua. Tes tambahan memeriksa kecocokan kontrak, konsistensi data antarperan, serta ringkasan 25 anak. Implementasi dibantu OpenAI Codex.

Menambahkan form program D1 (baru/ubah), undangan keluarga D2 dengan QR dan polling saat tab terlihat, catatan setelah sesi D5 dengan penyuntingan/persetujuan draf, pesan keluarga D6, serta permintaan audio berizin saat ditekan. Form dan aksi menggunakan kontrak/pemanggil API bersama; mode contoh menjelaskan bahwa data tidak tersimpan/dikirim ke keluarga nyata.

Status: uji browser 390/1280 px, autentikasi nyata, penyimpanan/pengiriman lintas peran, pemutaran audio/log dengar, serta integrasi endpoint/data rekaman masih belum selesai. Data contoh bukan hasil uji klinis atau data pengguna nyata. Tidak ada screenshot atau hasil integrasi yang dinyatakan lolos sebelum diperiksa.

## Bahan persiapan

Disusun sebelum Hacking Day dan dipakai sebagai acuan, bukan kode produk:
- Concept Proposal Talkly v19/v20 (Tabel 2 aturan status, Tabel 5 lapis fitur, subbab 4.1–4.4, Lampiran 1–9).
- Dokumen rancangan tim: alur layar final, rancangan produk, konten klinis berbasis riset (aktivitas EMT dan templat).

Seluruh kode di repositori ini ditulis selama Hacking Day (31 Okt 2026 12.00 – 1 Nov 2026 12.00 WIB); riwayat commit tidak di-squash.

## Penyesuaian terhadap Challenge Brief

Tidak ada perubahan lingkup; Talkly diajukan di subtema 2.

## AI Use Declaration

**AI di dalam produk**
- **OpenAI GPT-6 Luna**: memilih dan mengisi templat umpan balik buatan terapis, menyusun kalimat versi anak (panjangnya dibatasi aturan), menilai perluasan, menulis laporan ringkas untuk terapis, menyusun draf rencana mingguan dari bank aktivitas, membuat kalimat kartu benda dari nama benda, dan mengekstrak ucapan anak dari catatan malam. Setiap keluaran divalidasi kode; bila gagal atau ragu, sistem memakai templat cadangan dan menaikkan status anak ke Terapis meninjau. AI tidak menentukan status anak dan tidak mendiagnosis.
- **ElevenLabs Scribe v2** (cadangan **Deepgram Nova-3**): transkrip, cap waktu per kata, dan label pembicara. Semua angka (jeda, ajakan, giliran) dihitung kode dari cap waktu ini.

**AI sebagai alat bantu pengembangan**
- Claude Code (Anthropic) dipakai oleh anggota tim sebagai asisten menulis dan meninjau kode. Setiap anggota meninjau, menjalankan, dan bertanggung jawab atas kode yang di-commit atas namanya.

## Third-Party Declaration

| Layanan / pustaka | Dipakai untuk |
|---|---|
| ElevenLabs Scribe v2 | Speech-to-text (audio diproses di AS) |
| Deepgram Nova-3 | Cadangan speech-to-text |
| OpenAI API (GPT-6 Luna) | Model bahasa (transkrip tersamar diproses di AS) |
| Supabase | Basis data, penyimpanan audio privat, autentikasi terapis (Singapura) |
| Vercel | Hosting dan cron |
| Web Push (VAPID), pustaka `web-push` | Notifikasi |
| npm: `next`, `react`, `tailwindcss`, `zod`, `@supabase/supabase-js`, `bcryptjs`, `openai`, `qrcode`, `tsx` | Kerangka aplikasi, validasi, klien layanan, kode QR, alat uji |

Seluruh data di versi lomba adalah data contoh dan rekaman bernaskah yang diperankan tim.

## Hasil uji akurasi
