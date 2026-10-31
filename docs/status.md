# Status

Ditulis di akhir setiap titik integrasi supaya sesi berikutnya cukup membaca file ini.

## I0 · 31 Okt 2026 (A)

**Sudah ada**
- Kontrak `lib/kontrak/`: `api.ts` (41 endpoint dengan akses, skema request/response, galat, layar, titik), `hasil.ts`, `rekaman.ts` (mengikuti `HasilRekam` di `lib/perangkat/use-rekam.ts`), `laporan.ts`, `layar.ts` (matriks diturunkan dari `api.ts`, `periksaMatriks()` kosong), `contoh/index.ts` (kosong, diisi B dan C).
- `lib/server/`: `tanda.ts` (HMAC), `sesi.ts`, `akses.ts` (`denganAkses`, `cekTerapisMenangani`, `dbKeluarga`), `supabase.ts`, `respons.ts`.
- `/api/tes-sambungan`, `vercel.json` (sin1, dua cron), workflow deploy, `scripts/asap.sh`, README.

**Keputusan**
- Endpoint yang dijadwalkan di titik berikutnya ditandai todo di `uji/kontrak.test.ts` (konstanta `TITIK_SEKARANG`), supaya `npm run periksa` tetap hijau. Naikkan konstanta itu setiap titik ditutup.
- Penamaan layar v19: D5 = Setelah sesi, D6 = Pesan keluarga. Pemetaan ke v20 di README.
- `hasil.ts` menambah `suara_anak[]` (rentang suara anak) untuk pita percakapan D4; `stt.penyedia` boleh `tidak_ada` (K11).
- Endpoint terapis memakai `GET /api/setelah-sesi?anak=<id>`.
- `vercel.json` belum mematikan deploy Git (`git.deploymentEnabled`) sampai secret Vercel terisi, supaya deploy tidak berhenti total.

**Menunggu**
- Darryl: isi kunci Supabase `talkly-dev` di `.env.local`, isi env Vercel (Production → `talkly-demo`), isi tiga GitHub Secrets, cek sisa kredit ElevenLabs (tulis di sini).
- B dan C: contoh response di `lib/kontrak/contoh/`, tinjau kontrak, setujui commit penguncian.

**Kredit ElevenLabs:** belum dicek.

## C · 31 Oktober 2026 sekitar 13.55 WIB

Source dasbor D1-D6 dan login dibangun pada branch fitur/aditya-dasbor-terapis, commit b2b7fd0/e4315d2/ce2c8a0. Kontrak A serta komponen B dipakai; contoh D diregistrasikan atas persetujuan pengguna, tanpa mengubah skema. npm run periksa hijau: 48 pass, 35 skipped (UJI_URL kosong), 40 TODO (endpoint tahap berikutnya), build semua rute D lolos. Belum ada bukti visual 390/1280, screenshot, login nyata, aksi talkly-dev, audio/log dengar, atau hasil lintas peran. Pemutaran dari daftar rekaman terbaru dan varian fixture lengkap masih perlu dituntaskan.

Belum dipush/PR: credential-manager gagal dijalankan di lingkungan alat; pengguna perlu push dari terminal lokal yang berfungsi. Jangan mencoba token alternatif atau mengklaim perubahan sudah ada di GitHub. Status WAITING pada dependensi eksternal; bukan tugas C selesai. Checkpoint utama TEAM_PROGRESS.md; pemeriksaan adaptif berikutnya sekitar 30 menit. Penggunaan Codex dicatat pada kontribusi Aditya.
