# Talkly — checkpoint Orang C

## Aturan terbaru pengguna

Kerjakan C langsung pada main, tanpa branch fitur atau PR baru. Main lokal melacak origin/main. Pengguna secara eksplisit mengizinkan commit/push C langsung ke main setelah validasi. Jangan force-push, mengganti author, menimpa perubahan A/B, atau melewati perlindungan branch. Untuk Git lokal yang terkendala GCM, koneksi plugin GitHub boleh dipakai: verifikasi author aditt24/aditya24sp@gmail.com sebelum update ref, sertakan expected SHA dan jangan overwrite main yang berubah.

## Kondisi terbaru

- Pekerjaan D1-D6, login dan audio sudah di main melalui PR #1 yang selesai di-merge c2a9001. Tidak membuat ulang PR itu.
- Baseline sesi ini 9202dcf: endpoint dasbor A tersedia dan token tampilan B terbaru dipakai tanpa mengedit milik mereka.
- Perbaikan C sesi ini: sembunyikan angka pengasuh bila kurang dari 3 rekaman atau angka null; pesan persetujuan rencana mengikuti minggu_mulai dari respons resmi, bukan klaim langsung terkirim ke semua keluarga.
- Hanya tiga file C tersebut dan checkpoint yang berubah; tidak ada perubahan skema/backend/database/deploy A atau komponen bersama B.
- Pemeriksaan penuh terbaru sesi 79801 berhasil exit 0: typegen, TypeScript, lint, 126 pass, 0 fail, 35 skipped (UJI_URL belum ada), 9 TODO endpoint berikutnya, dan build seluruh rute. Worker lokal dibatasi satu dan direktori keluaran disiapkan untuk mengatasi EPERM; konfigurasi A tidak diubah. Jangan menganggap tes skipped/TODO sebagai lolos integrasi.

## Bukti integrasi baca nyata

Skrip lokal work/integrasi-baca-c.ts menggunakan POST /api/demo untuk sesi Kak Nadia (cookie saja, tidak menyimpan data), lalu GET data contoh resmi. Hasil: sesi demo 204; minggu ini, bank aktivitas, kartu anak Raka, program anak, daftar undangan, setelah sesi dan pesan semuanya HTTP 200 dan lolos skema API resmi. Tidak ada payload keluarga/kuki/kunci dicetak. Ini bukan bukti login dengan email/kata sandi, aksi tulis, audio, atau UI visual sudah lolos.

## Status tugas C

UI seluruh D1-D6 tersedia, tapi tugas keseluruhan IN PROGRESS sampai bukti prompt C lengkap.

- C0.1: checkout main dan pengelola paket lokal siap. npm/npx di ../npm-tool; tambahkan sementara ke PATH, jangan ubah package.json tim.
- C0.2: contoh D terdaftar (persetujuan pengguna), bank resmi A, ID keluarga B, varian kosong/tidak cukup/nama panjang; skema/tes tersedia. Contoh audio nyata dan review penuh belum selesai.
- C1/C2: login/layout, program, undangan, minggu ini dan kartu anak sudah dibangun. Endpoint nyata tersedia dan GET sudah cocok, tetapi uji aksi simpan/gabung/QR pada talkly-dev dan screenshot 390/1280 belum selesai.
- C3: catatan/draf/pesan/audio dibangun; persetujuan kini membawa tanggal minggu server. Uji catatan tersimpan meski AI bermasalah, kata dikonfirmasi muncul lintas layar, draf usang setelah reload, pesan lintas peran, dan audio/log dengar belum selesai.
- C5: kontribusi aktual dan penggunaan Codex tercatat di README; jangan mengklaim AI sebagai anggota manusia keempat.

## Batas kerja

A memiliki app/api, server, database, kontrak, pipeline dan deploy. B memiliki UI orang tua, perangkat/panggil/useData, gaya serta komponen bersama. C memiliki app/(terapis), components/terapis, contoh D yang diizinkan, dokumentasi C dan kontribusinya sendiri pada README. Perubahan kontrak atau folder A/B perlu persetujuan. Semua API produk melalui panggil; gunakan gaya/komponen B. Anak tidak dinilai/didiagnosis; laporan keluarga terpisah dari angka terukur.

Checkout C belum mempunyai .env.local. Jangan mengambil secret melalui chat. Aksi tulis nyata hanya talkly-dev, jangan mengotori produksi. Uji baca memakai persona demo resmi diperbolehkan tanpa perubahan data. Browser headless/localhost lintas lingkungan alat sebelumnya bermasalah; bukti visual belum ada, jangan membuat screenshot tiruan.

## Eksekusi berikut

1. Baca checkpoint, periksa delta main sejak baseline terakhir dan hanya file terkait. Jangan mengulang analisis/proposal/tes valid tanpa perubahan relevan.
2. Kerjakan perbaikan C yang READY, simpan yang PARTIALLY DEPENDENT tanpa asumsi API, tunggu yang FULLY DEPENDENT.
3. npm run periksa harus hijau sebelum kirim ke main; review diff hanya C. Metadata/kunci tidak boleh masuk commit.
4. Saat main bergerak bersamaan, gunakan parent/base tree terbaru, periksa konflik file C dan expected SHA; jangan menimpa kontribusi baru.
5. Setelah pengiriman, verifikasi main berisi commit, CI/deploy dan hasil yang relevan. Local stash lama adalah backup yang sudah terpublikasi; jangan diterapkan ulang.
6. Lanjutkan visual dan integrasi dev bila akses tersedia; jangan menyatakan semua selesai dari build/GET saja.

## Pemantauan

Interval adaptif sesuai bukti: 15-20 menit bila serah-terima/commit relevan aktif, 30-45 menit saat menunggu implementasi upstream, 60-90 menit setelah dua siklus tanpa perubahan relevan. Pekerjaan READY dikerjakan tanpa menunggu timer. Tidak memantau sesi Claude Code di laptop A/B dan tidak menjanjikan kapan mereka selesai. Saat tidak berubah tetap diam; beri kabar hanya kemajuan material, selesai, kegagalan baru atau tindakan pengguna.

Hentikan fitur baru 1 Nov 2026 06.00 WIB, setelahnya hanya perbaikan/uji. Batas akhir 1 Nov 12.00 WIB; hentikan pemantauan saat batas atau seluruh tugas/integrasi selesai. Jangan meneruskan kode produk setelah batas.
