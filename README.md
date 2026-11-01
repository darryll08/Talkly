# Talkly

PWA dari klinik untuk orang tua anak terlambat bicara (18–48 bulan). Orang tua merekam 1 menit rutinitas di rumah, sistem mengukur jeda menunggu dan giliran percakapan, lalu hasilnya menjadi umpan balik untuk orang tua dan kartu anak untuk terapis. Anak tidak memakai layar.

Tim Boomerang, Universitas Airlangga · INCEPTION 2026 · Subtema 2: Health, Well-being, and Accessibility.

- Aplikasi daring: https://talkly-orcin.vercel.app (mode demo di beranda)
- Repositori: https://github.com/darryll08/Talkly
- Video demo: https://youtu.be/wZaqm-0Xj7I
- Pitch deck: https://drive.google.com/drive/folders/17_R4Q53D-kjRtCfer8yhU9L6mEL0I5KE?usp=sharing

## Menjalankan

Gunakan **Node.js 24** dan npm. Setelah mengunduh atau meng-clone repositori, masuk ke folder proyek lalu jalankan:

```bash
npm ci
```

Salin `.env.example` menjadi `.env.local`:

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local
```

```powershell
# PowerShell
Copy-Item .env.example .env.local
```

### Pratinjau UI dengan data contoh

Untuk mencoba tampilan tanpa backend, isi `.env.local` dengan:

```dotenv
NEXT_PUBLIC_PAKAI_CONTOH=1
NEXT_PUBLIC_DEMO=1
```

Jalankan `npm run dev`, lalu buka http://localhost:3000/masuk#demo. Mode ini memakai data contoh di peramban; tidak menguji autentikasi nyata, penyimpanan database, pemrosesan audio/AI, atau sinkronisasi antarperan.

### Terhubung ke backend

- Gunakan proyek Supabase pengembangan. Terapkan migrasi di `supabase/migrations/` secara berurutan untuk menyiapkan database, RLS, dan bucket audio privat.
- Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `SESI_RAHASIA` pada `.env.local`. `SESI_RAHASIA` minimal 16 karakter.
- Isi kunci STT/AI, Web Push, dan cron sesuai `.env.example` untuk fitur yang akan dijalankan. Kunci server tidak boleh diberi awalan `NEXT_PUBLIC_`.
- Biarkan `NEXT_PUBLIC_PAKAI_CONTOH` kosong atau `0` agar aplikasi memakai API nyata. Untuk persona demo backend, aktifkan `DEMO=1` dan `NEXT_PUBLIC_DEMO=1` hanya di lingkungan demo dengan data contoh yang sudah disiapkan.
- Bila perlu mengisi ulang data contoh di proyek pengembangan, `npm run seed` memerlukan `DEMO_TERAPIS_KATA_SANDI` di `.env.local`. Seed menghapus lalu mengisi ulang data bertanda `data_contoh`; jangan jalankan untuk pengujian pada produksi.

Anggota yang sudah memiliki akses proyek Vercel dapat mengambil konfigurasi melalui:

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local
```

Pilih proyek dan lingkungan pengembangan yang benar. Perintah tersebut memerlukan login Vercel serta akses proyek tim; tidak diperlukan untuk mode pratinjau UI. `env pull` menulis konfigurasi ke `.env.local`, jadi cadangkan konfigurasi lokal bila sudah ada.

Setelah konfigurasi siap:

```bash
npm run dev
```

Buka http://localhost:3000. Jangan commit `.env.local` atau kredensial ke GitHub.

### Pemeriksaan


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

**Keluarga (ponsel, tanpa kata sandi)**
- Gabung lewat kode undangan atau QR dari terapis, lalu masuk dengan kode masuk pribadi.
- Tiga izin terpisah yang mati sampai keluarga menyalakannya: rekaman boleh dinilai, terapis boleh mendengar (7 hari), pengelola boleh memutar Momen anak.
- Hari Ini: daftar 2–3 aktivitas lima menit dari terapis, tanpa skor. Kartu aktivitas berisi tiga langkah dan apa yang dilakukan bila anak belum mau.
- Kartu foto benda: foto benda kesukaan anak menjadi kartu latihan. Foto tetap di ponsel.
- Rekam 1 menit dengan hitung mundur menunggu, lalu umpan balik singkat (satu pujian, satu saran) dari templat terapis.
- Bila rekaman belum bisa dinilai (terlalu pendek, TV keras), keluarga mendapat alasan dan tips, atau bisa menceritakan sendiri dan mengisi catatan malam.
- Kemajuan, ringkasan keluarga minggu ini, pesan dengan terapis, dan profil untuk mengubah izin.

**Terapis (web)**
- Minggu ini: sesi tiga hari ke depan dan anak yang perlu dibahas.
- Program anak: tahap bahasa, kata target, dan aktivitas minggu ini.
- Kartu anak sebelum sesi: jeda, ajakan yang berhasil, giliran percakapan selama 14 hari, pita percakapan, hasil per pengasuh, dan laporan keluarga yang dipisah dari angka terukur.
- Setelah sesi: catatan dan draf rencana minggu depan dari AI. Rencana baru terkirim ke keluarga setelah terapis menyunting dan menyetujuinya.
- Undangan keluarga dengan kode dan QR, serta pesan keluarga.

**Pengelola klinik**
- Membuat klinik dan akun terapis.

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

Membangun fondasi server: kontrak data antarbagian, sesi HMAC dan penjaga akses, tes penjaga, serta deploy otomatis lewat GitHub Actions. Menyusun migrasi 18 tabel dengan RLS dan bucket audio privat, bank aktivitas, 18 templat terapis, data contoh persona, dan mode demo. Membangun pipeline rekaman: unggah, STT Scribe v2 dengan cadangan Deepgram, cek mutu, pengenalan perekam dan suara anak, penghitungan ajakan, jeda, dan giliran, serta umpan balik GPT-6 Luna yang divalidasi kode. Menulis aturan status Tabel 2 dan seluruh endpoint keluarga dan terapis: Hari Ini, aktivitas, laporan malam, kemajuan, undangan dan kode masuk, kartu anak, program, setelah sesi dengan draf rencana AI dan persetujuan terapis, pesan dua arah, izin rekaman, notifikasi, serta cron pengingat dan penghapusan audio. Menjalankan uji akurasi 15 skenario dan 50 draf rencana acak, lalu memperbaiki mesin ukur dari temuannya. Menghubungkan kartu foto benda ke kata target per aktivitas dan menyusun README. Implementasi dibantu Claude Code.

### I Wayan Satya Dharma Sadhana

Menyiapkan kerangka proyek Next.js dan fondasi aplikasi orang tua: sistem tampilan, perangkat ponsel, dan PWA. Membangun layar orang tua O1–O12, Pesan, dan Cek perangkat di atas kontrak resmi, termasuk layar Rekam dengan hitung mundur menunggu serta berhenti dan ulang kapan saja. Melakukan audit tampilan dan menyusun design brief, lalu menerapkan perbaikan prioritas (token warna, font, kontras, waktu muat) dan tampilan akhir. Menyatukan login semua peran di satu halaman Masuk dengan penjaga rute, keluar, dan panel admin, serta menambah akun demo. Membuat kartu foto benda yang bisa dipilih dan diganti fotonya, menambah bank aktivitas menjadi 50 (33 aktivitas baru masih draf untuk ditinjau terapis), merapikan beberapa tampilan dasbor terapis, dan mengatasi batas kuota unggah Vercel saat deploy.

### Aditya Saputra

Menyiapkan layout dasbor terapis dan navigasi anak, form masuk terapis, daftar Minggu ini (D3), serta kartu anak (D4) dengan rentang strategi, pita percakapan, hasil per pengasuh, dan panel laporan keluarga terpisah. Contoh respons D memakai kontrak resmi dan ID keluarga yang sama dengan layar orang tua. Tes tambahan memeriksa kecocokan kontrak, konsistensi data antarperan, serta ringkasan 25 anak. Implementasi dibantu OpenAI Codex.

Menambahkan form program D1 (baru/ubah), undangan keluarga D2 dengan QR dan polling saat tab terlihat, catatan setelah sesi D5 dengan penyuntingan/persetujuan draf, pesan keluarga D6, serta permintaan audio berizin saat ditekan. Form dan aksi menggunakan kontrak/pemanggil API bersama; mode contoh menjelaskan bahwa data tidak tersimpan/dikirim ke keluarga nyata.

Setelah endpoint server selesai, dasbor terapis dihubungkan ke kontrak server terbaru dan disesuaikan dengan API sungguhan, termasuk penanda kecukupan data dan umpan balik saat rencana disetujui. Data contoh bukan hasil uji klinis atau data pengguna nyata.

## Bahan persiapan

Disusun sebelum Hacking Day dan dipakai sebagai acuan, bukan kode produk:
- Concept Proposal Talkly v19/v20 (Tabel 2 aturan status, Tabel 5 lapis fitur, subbab 4.1–4.4, Lampiran 1–9).
- Dokumen rancangan tim: alur layar final, rancangan produk, konten klinis berbasis riset (aktivitas EMT dan templat).

Seluruh kode di repositori ini ditulis selama Hacking Day (31 Okt 2026 12.00 – 1 Nov 2026 12.00 WIB); riwayat commit tidak di-squash.

## Penyesuaian terhadap Challenge Brief

Tidak ada perubahan lingkup; Talkly diajukan di subtema 2.

## AI Use Declaration

**AI di dalam produk**
- **OpenAI GPT-6 Luna**: memilih dan mengisi templat umpan balik buatan terapis, menyusun kalimat versi anak (panjangnya dibatasi aturan), menghasilkan perkiraan perluasan sebagai keluaran tambahan (angka perluasan akhir dihitung oleh kode), menulis laporan ringkas untuk terapis, menyusun draf rencana mingguan dari bank aktivitas, membuat kalimat kartu benda dari nama benda, dan mengekstrak ucapan anak dari catatan malam. Setiap keluaran divalidasi kode; bila gagal atau ragu, sistem memakai templat cadangan dan menaikkan status anak ke Terapis meninjau. AI tidak menentukan status anak dan tidak mendiagnosis.
- **ElevenLabs Scribe v2** (cadangan **Deepgram Nova-3**): transkrip, cap waktu per kata, dan label pembicara. Semua angka (jeda, ajakan, giliran) dihitung kode dari cap waktu ini.

**AI sebagai alat bantu pengembangan**
- Claude Code (Anthropic) dan OpenAI Codex dipakai oleh anggota tim sebagai asisten menulis dan meninjau kode. Setiap anggota meninjau, menjalankan, dan bertanggung jawab atas kode yang di-commit atas namanya.

**AI dalam pembuatan video demo**
- **HyperFrames**: menyusun video demo dari komposisi HTML (judul, transisi, potongan rekaman layar aplikasi).
- **ElevenLabs** (text-to-speech): suara narasi video. Suara yang dipakai adalah klon suara anggota tim sendiri, dibuat atas persetujuannya.
- Rekaman layar di video diambil dari aplikasi yang berjalan sungguhan; tidak ada layar yang dibuat ulang dengan AI.

## Third-Party Declaration

| Layanan / pustaka | Dipakai untuk |
|---|---|
| ElevenLabs Scribe v2 | Speech-to-text (audio diproses di AS) |
| Deepgram Nova-3 | Cadangan speech-to-text |
| OpenAI API (GPT-6 Luna) | Model bahasa (transkrip tersamar diproses di AS) |
| Supabase | Basis data, penyimpanan audio privat, autentikasi terapis (Singapura) |
| Vercel | Hosting dan cron |
| Web Push (VAPID), pustaka `web-push` | Notifikasi |
| HyperFrames, ElevenLabs text-to-speech | Pembuatan video demo (bukan bagian aplikasi) |
| npm: `next`, `react`, `tailwindcss`, `zod`, `@supabase/supabase-js`, `bcryptjs`, `openai`, `qrcode`, `tsx` | Kerangka aplikasi, validasi, klien layanan, kode QR, alat uji |

Seluruh data di versi lomba adalah data contoh dan skenario percakapan bernaskah, bukan data anak sungguhan.

## Hasil uji akurasi

Mesin ukur diuji pada 15 skenario percakapan bernaskah: jeda pendek dan panjang, suruhan beruntun, pertanyaan beruntun, campuran bahasa Jawa, ayah menyela, pengasuh sebagai perekam, anak menjawab cepat, suara anak yang bukan kata, TV keras, dan rekaman terlalu pendek. Hasil per skenario ada di [`docs/hasil-uji.md`](docs/hasil-uji.md).

Hasil ini merupakan evaluasi internal pada skenario bernaskah, bukan bukti manfaat klinis atau pengujian pada keluarga nyata.

| Ukuran | Target | Hasil |
|---|---|---|
| Selisih jeda rata-rata | ≤ 0,5 detik | 0,28 detik (94 jeda) |
| Ketepatan pengenalan ajakan (F1) | ≥ 80% | 84% (presisi 82%, recall 86%) |
| Kesesuaian kategori ajakan | ≥ 80% | 86% dari 115 ajakan |
| Kesesuaian perluasan | ≥ 80% | 85% dari 13 skenario |
| Mutu rekaman sesuai harapan (TV keras dan rekaman pendek ditolak) | 15/15 | 15/15 |
| Kasus regresi tertandai Bahas minggu ini | 10/10 | 10/10 (`uji/status.test.ts`) |
| Draf rencana acak bebas kata terlarang dan hanya dari bank aktivitas | 50/50 | 50/50, tanpa cadangan (`uji/rencana-acak.ts`, GPT-6 Luna) |

Temuan dari pengujian yang sudah diperbaiki:
- Perluasan sekarang dihitung kode (`lib/ukur/perluasan.ts`), bukan AI, karena perkiraan AI tidak konsisten.
- TV atau musik yang menumpuk dengan suara bicara tidak selalu ditandai STT; mutu kini juga memeriksa level suara di sela bicara dari jejak ponsel (`lib/ukur/mutu.ts`).
- Suara anak dikenali dari median panjang ucapan, sehingga satu ucapan orang tua yang salah dilabeli STT tidak membuat anak terbaca sebagai orang dewasa (`lib/ukur/pembicara.ts`).

Keterbatasan: suara anak yang sangat pendek kadang tidak terpisah dari suara orang tua, dan skenario dengan banyak giliran cepat (N09) serta suara anak yang bukan kata (N14) masih di bawah rata-rata.

Cara mengulang: `npm run uji:akurasi` menjalankan ulang pengukuran dari transkrip tersimpan di `data/uji/transkrip/` (tanpa kredit STT), membandingkannya dengan kunci di `data/uji/kunci/`, dan menulis `docs/hasil-uji.md`. Naskah dan kunci dibuat dari `uji/naskah.ts` (`npx tsx uji/cetak-naskah.ts`, hasil siap baca di [`docs/naskah-rekaman.md`](docs/naskah-rekaman.md)).

Pemeriksaan konsistensi: `npx tsx uji/akurasi.ts --simulasi` menjalankan mesin pada transkrip sempurna yang dibuat dari naskah. Hasilnya 100% sesuai kunci; ini hanya memastikan kunci dan mesin memakai definisi yang sama, bukan hasil uji akurasi.
