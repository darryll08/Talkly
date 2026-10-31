# Daftar tugas

Centang hanya bila "Selesai bila" terpenuhi dan buktinya ada di repo. Tulis tanggal, commit, dan catatan (misalnya "belum dites di HP"). Setiap orang hanya mencentang bagiannya sendiri.

## A (Darryl): mesin dan data

### 4.0 Fondasi (I0)
- [x] A0.1 Kerangka proyek. Dikerjakan B (commit b281a99) atas kesepakatan tim; repo publik dan collaborator diatur A.
- [ ] A0.2 Supabase, kunci, Vercel. `vercel.json` dan `/api/tes-sambungan` ada; menunggu migrasi untuk cek Supabase ok, dan secret Vercel untuk deploy otomatis.
- [x] A0.3 Akses dan sesi (`lib/server/`), tes tanda tangan `uji/tanda.test.ts` lolos.
- [ ] A0.4 Kontrak bertiga. Skema dan matriks ditulis A; menunggu contoh B dan C serta persetujuan sebelum commit penguncian.
- [x] A0.5 Tes penjaga `uji/kontrak.test.ts`, `uji/akses.test.ts` (endpoint I1–I3 masih todo).
- [ ] A0.6 README dan deklarasi. Kerangka, arsitektur, teknologi, bahan persiapan, AI Use dan Third-Party sudah diisi.
- [ ] A0.7 `scripts/asap.sh` ada; belum dijalankan ke produksi (endpoint belum ada).
- [ ] A0.8 Workflow deploy ada; menunggu secret `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

### 4.1 Basis data dan login
- [ ] A1.1 Migrasi skema · I1
- [ ] A1.2 RLS dan storage · I1
- [ ] A1.3 Gabung dan undangan · I2
- [ ] A1.4 Masuk di HP baru dan kelola akun · I3
- [ ] A1.5 Izin rekaman · I3
- [ ] A1.6 Login terapis · I1

### 4.2 Data contoh
- [ ] A2.1 Bank aktivitas dan templat · I1
- [ ] A2.2 Seed demo · I2
- [ ] A2.3 Mode demo · I1

### 4.3 Pipeline satu rekaman
- [ ] A3.1 Terima unggahan · I1
- [ ] A3.2 STT · I1
- [ ] A3.3 Mutu · I1
- [ ] A3.4 Perekam dan suara anak · I1
- [ ] A3.5 Ajakan, jeda, giliran · I1
- [ ] A3.6 Cadangan STT gagal · I2
- [ ] A3.7 Hapus audio · I3

### 4.4 AI
- [ ] A4.1 Penilaian satu rekaman · I1
- [ ] A4.2 Draf rencana minggu depan · I3
- [ ] A4.3 Kartu benda dan ekstraksi catatan malam · I3

### 4.5 Laporan, kemajuan, status
- [ ] A5.1 Laporan keluarga · I2
- [ ] A5.2 Aturan status · I2
- [ ] A5.3 Kurang tepat · I2
- [ ] A5.4 Agregat dan kemajuan · I2
- [ ] A5.5 Dasbor terapis · I1/I2
- [ ] A5.6 Pengingat dan push · I3

### 4.6–4.8
- [ ] A6.1 Pemutaran audio tercatat · I3
- [ ] A7.1 Naskah dan kunci (N01, N02 jam 4–6; sisanya jam 12–16)
- [ ] A7.2 Skrip akurasi · I3
- [ ] A7.3 Regresi dan rencana · I3
- [ ] A8.1 Penutupan (README lengkap, repo publik, tag `submission-24h`, Devpost)
- [ ] A8.2 Kontribusi Darryl di README

## B (Wayan)

Semua layar B dicek di browser 390 px dengan `NEXT_PUBLIC_PAKAI_CONTOH=1` (31 Okt): tanpa scroll samping, tanpa galat console. Belum ada yang dites di HP Android atau dengan server asli; kartu dengan bukti HP belum dicentang.

### 4.0 Fondasi (I0)
- [x] B0.1 Siapkan laptop. Commit atas nama Satyadsadhana tampil di GitHub. Deploy otomatis belum dicek (menunggu secret Vercel A0.8).
- [x] B0.2 Pemanggil API: `lib/perangkat/panggil.ts`, `saya.ts`, `use-data.ts`. `grep 'fetch("/api'` hanya di panggil.ts (31 Okt, 128d149 + commit ini).
- [ ] B0.3 Sistem tampilan dan `/dev/gaya` ada (128d149); screenshot `docs/layar/gaya.png` dan pemeriksaan C belum.
- [x] B0.4 Contoh layar O di `lib/kontrak/contoh/ortu.ts`, lolos `uji/kontrak.test.ts` (31 Okt, commit ini).

### 4.2 Perangkat ponsel
- [ ] B1.1 PWA: manifest, ikon, sw.js, halaman offline ada. Lighthouse dan uji mode pesawat belum.
- [ ] B1.2 Perekam `use-rekam.ts` ada. Belum dites di HP Android.
- [x] B1.3 Jejak nada: tes 150/300/450 Hz ±5% tanpa salah oktaf lolos (`lib/perangkat/jejak.test.ts`, 128d149).
- [ ] B1.4 Antrean unggah ada. Uji mode pesawat belum.
- [ ] B1.5 Klip lokal ada. Belum dites dengan rekaman asli.
- [ ] B1.6 Notifikasi ada. Belum dites di HP (VAPID belum ada di laptop B).
- [ ] B1.7 Cek perangkat ada. Screenshot dari HP belum.

### 4.3–4.5 Layar orang tua
- [ ] B2.0 Layout dan nav. Build lolos; belum dicek di HP dengan notch.
- [ ] B2.1 O3 Hari ini · tampil dari contoh; menunggu endpoint A.
- [ ] B2.2 O4 Kartu aktivitas · tampil dari contoh; menunggu endpoint A.
- [ ] B2.3 O5 Rekam 1 Menit · menunggu HP + endpoint A.
- [ ] B2.4 O5b, O6, O7 · tampil dari contoh; menunggu rekaman asli.
- [ ] B2.5 O9 Catatan malam · menunggu endpoint A.
- [ ] B2.6 O10 Kemajuan · menunggu endpoint A.
- [ ] B3.1 O1 Gabung · B3.2 O2 Mulai · B3.3 O1c Masuk · B3.4 O4b Kartu benda · B3.5 O8 Ceritakan · B3.6 O11 Keluarga · B3.7 O12 Profil · B3.8 Pesan: semua tampil dari contoh; menunggu endpoint A.
- [ ] B4.1 Beranda dan mode demo · tampil; menunggu `POST /api/demo`.
- [ ] B5.1 Kontribusi Wayan di README.

## C (Aditya)
