# Changelog: submission-24h → finalist-release

Semua perubahan sesudah tag `submission-24h` (`ee761ff`, 1 November 2026 10.03 WIB) menuju tag `finalist-release`.
Sesuai aturan Finalist Preparation, isinya hanya perbaikan bug, stabilisasi, perapian tampilan, performa, keamanan dasar, dan dokumentasi. Tidak ada fitur baru dan tidak ada perubahan substansi produk.

Perbandingan lengkap: https://github.com/darryll08/Talkly/compare/submission-24h...main

Cara mengisi: setiap anggota menambah baris untuk perubahannya sendiri pada commit yang sama, ditulis dari sudut pengguna, dengan commit, nama, dan bukti (tes atau pemeriksaan). Commit yang belum ada ditulis "belum di-commit" lalu diganti hash-nya.

## Perbaikan bug

- **Rekaman bisa tertahan di "Sedang dinilai" selamanya.** Bila anak bersuara tepat di ujung ajakan orang tua dan orang tua tidak menanggapi dalam 5 detik, mesin ukur gagal (`TypeError`) saat menentukan Momen anak, karena suara anak dicari ulang dari waktu yang sudah dibulatkan. Rekaman lalu tetap berstatus antre dan dicoba ulang tanpa akhir. Sekarang suara anak disimpan langsung saat ajakan dinilai. `lib/ukur/ukur.ts`. Bukti: tes baru di `uji/ukur.test.ts` gagal sebelum perbaikan dan lolos sesudahnya; 153 tes lolos. (Wayan, `4b9aab7`, 11 Nov 2026)
- **Rekaman yang terus gagal diproses kini berhenti dicoba.** Setelah tiga kali gagal, rekaman ditandai "belum bisa dinilai" dengan alasan bahwa kesalahan ada di sistem, bukan cara merekam. Audionya dihapus seperti rekaman ditolak lain, transkrip tetap disimpan untuk ditelusuri, dan status anak naik ke Terapis meninjau. `lib/ukur/proses.ts`, `lib/kontrak/rekaman.ts`. Belum diuji ke database asli. (Wayan, `4b9aab7`, 11 Nov 2026)
- **Kata target bertanda khusus tidak lagi membuat penilaian rekaman gagal.** Saat menilai rekaman, server menghitung berapa kali orang tua mengucapkan tiap kata target dengan pola pencarian (RegExp). Kata target yang ditulis terapis dengan kurung tidak lengkap ("susu (botol", "bola)"), kurung siku, atau "c++" merusak pola itu, sehingga setiap rekaman anak tersebut gagal dinilai sampai kata targetnya diubah. Kata target dengan kurung lengkap tidak error, tetapi bisa terhitung meleset. Sekarang tanda khusus dinetralkan dulu sehingga kata dicari apa adanya, memakai fungsi yang sudah dipakai untuk penyamaran nama. Cara menghitung dan tampilan tidak berubah. `lib/ai/nilai.ts`, `lib/ai/samaran.ts`. Bukti: tes baru di `uji/ai.test.ts` gagal sebelum perbaikan dan lolos sesudahnya; tsc, lint, 157 tes, dan build lolos. (Wayan, `1ae4e02`, 13 Nov 2026)
- **Halaman Program anak tidak lagi gagal untuk anak tanpa rencana, dan pilihan aktivitasnya benar-benar tersimpan.** Ditemukan saat uji produksi 13 Nov: enam anak di dasbor Kak Nadia (Dafa, Gita, Mika, Salsa dari data contoh, serta dua anak buatan pengunjung demo) tidak punya rencana yang disetujui. Halaman Program mereka menampilkan galat karena respons mewajibkan minimal satu aktivitas, dan menyimpan aktivitas dibalas "berhasil" padahal tidak ada yang tersimpan, karena kode hanya mengganti aktivitas pada rencana yang sudah ada. Sekarang halaman Program tetap terbuka (form tetap mewajibkan minimal satu aktivitas saat disimpan), menyimpan aktivitas untuk anak tanpa rencana membuat rencana awal seperti saat membuat anak baru, dan aktivitas lama baru dihapus setelah aktivitas baru berhasil masuk. Kegagalan menyimpan aktivitas saat membuat anak baru atau menyetujui draf kini dilaporkan sebagai galat, bukan diam-diam; rencana kosong dari draf yang gagal dihapus lagi. `lib/kontrak/api.ts`, `app/api/anak/[id]/route.ts`, `app/api/anak/route.ts`, `app/api/rencana/[drafId]/setujui/route.ts`. Bukti: di produksi, halaman Program Elsa gagal dengan "tidak sesuai kontrak" dan PATCH aktivitas MANDI-01 dibalas 200 tetapi tetap kosong; tes baru di `uji/kontrak.test.ts` gagal sebelum perbaikan dan lolos sesudahnya; tsc, lint, 158 tes, dan build lolos. Belum diuji ke database asli sampai dideploy. (Wayan, `45e48bc`, 13 Nov 2026)

## Stabilisasi

- **Rekaman yang prosesnya terhenti di tengah jalan kini juga berhenti dicoba.** Batas tiga kali dari `4b9aab7` hanya menghitung proses yang gagal dengan galat. Proses yang dimatikan server karena melewati batas 60 detik (misalnya layanan transkripsi lambat) tidak sempat tercatat, sehingga rekaman bisa diproses ulang tanpa akhir dan terus memakai kredit transkripsi dan AI. Sekarang percobaan dihitung saat proses dimulai; klaim keempat langsung menandai rekaman "belum bisa dinilai". `lib/ukur/proses.ts`. Bukti: tes baru di `uji/stabil.test.ts` (proses yang terus dimatikan berhenti setelah tiga percobaan); tsc, lint, 156 tes, dan build lolos. Belum diuji ke database asli. (Wayan, `e6247f5`, 13 Nov 2026)

## Tampilan

- **Layar "Sedang dinilai" punya batas waktu.** Menit pertama tetap memeriksa hasil setiap 2 detik, lalu setiap 10 detik. Setelah 8 menit layar berhenti menunggu dan menampilkan "Penilaian belum selesai" dengan tombol Cek lagi dan Kembali ke Hari ini. Bila rekaman gagal karena sistem, tips merekam tidak ditampilkan. `app/(ortu)/hasil/[rekamanId]/hasil.tsx`. Dicek di browser lebar 375 px dengan data contoh. (Wayan, `4b9aab7`, 11 Nov 2026)

- **Perapian tampilan (UI/UX) tanpa fitur baru.** Warna tetap memakai token yang sama. Semua fitur, tombol, dan data tetap ada; hanya tata letak dan gaya yang berubah. (Wayan, `0cdf9c7`, 11 Nov 2026)
  - Profil: ringkasan Anak, Terapis, Peran; seksi berikon; izin rekaman diringkas menjadi judul dan satu kalimat (nama penyedia, negara, dan dasar hukum tidak lagi ditampilkan di layar, tetap ada di respons API). Berlaku juga di layar Mulai. `app/(ortu)/profil/page.tsx`, `components/izin-rekaman.tsx`.
  - Kemajuan: grafik pil jeda per minggu dengan garis target 3 detik, ubin giliran/rekaman/ajakan 14 hari, bilah menuju syarat bila data belum cukup, kartu kata anak dengan keterangan. `app/(ortu)/kemajuan/page.tsx`.
  - Dasbor terapis: sidebar di layar lebar, kartu angka status, pilih hari sesi berbentuk pil tanggal, panel Perlu perhatian dan Keaktifan keluarga, pencarian anak. Kartu anak: kepala putih dengan kata target, tren mingguan sebagai grafik pil, tata letak dua kolom; tab halaman anak berbentuk pil. `app/(terapis)/`, `components/terapis/`.
  - Beranda dan Masuk: komposisi kartu pratinjau aplikasi, ringkasan angka, bagian untuk terapis, ajakan gabung; tab Masuk berbentuk pil. `app/page.tsx`, `app/(tamu)/masuk/page.tsx`, `components/merek.tsx`.
  - Dicek di browser 375 px dan 1440 px dengan data contoh, tanpa scroll ke samping; tsc, lint, 153 tes, dan build lolos.

- **Perbaikan dari audit UI/UX** (`docs/audit-uiux-final.md`). Kontras: angka dan ikon di atas oranye 2,71 → 5,85:1; sakelar mati 1,41 → 5,70:1; penanda kata dilaporkan keluarga tidak lagi hanya warna; teks minimal 13 px. Kartu anak terapis dibuka dengan "Yang perlu dibahas"; ikon panah yang tidak bisa diklik di dasbor dihapus. Hari ini punya satu ajakan utama; tombol aksi kartu aktivitas menempel di bawah; umpan balik dibuka dengan pujian, angka giliran menjadi pendukung; layar ditolak menyorot tips yang sesuai alasan. Dicek di browser 375 px dan 1440 px; tsc, lint, 153 tes, dan build lolos. (Wayan, `0cdf9c7`, 11 Nov 2026)

- **Beranda lebih jelas untuk juri dan terapis.** Tanpa fitur, rute, atau tombol baru; semua klaim diambil dari aplikasi yang berjalan. (Wayan, `24d459c`, 13 Nov 2026)
  - Judul menonjolkan pembeda, "Ponsel melatih orang tua, bukan anak.", dua baris di layar 640 px ke atas; kalimat pembuka menceritakan satu putaran (rekam 1 menit → jeda menunggu terukur → dibaca terapis) dan menegaskan anak tidak memakai layar.
  - Bagian atas memusatkan satu contoh hasil rekaman: kartu jeda menunggu dan kartu hasil berdampingan, lurus, tidak bertumpuk (atas-bawah di ponsel).
  - Bagian langkah menjadi "Cara kerjanya: satu putaran, dari rumah ke ruang terapi" dengan pelaku tiap langkah (Keluarga, Talkly, Terapis).
  - Angka pratinjau dasbor disamakan dengan data demo (25 → 10 anak).
  - Bagian di bawah layar muncul pelan saat digulir, bergiliran per kartu, sekali saja; dimatikan bila "kurangi gerakan" aktif, dan isi tetap terlihat tanpa JavaScript.
  - `app/page.tsx`, `components/merek.tsx`, `components/pemicu-gulir.tsx`, `app/globals.css`.
- **Halaman Masuk dirapikan.** Kartu pratinjau di panel kiri lurus dan berdampingan, kalimat pembuka dipendekkan menjadi "Satu menit, satu langkah ke kata pertama." (dua baris), akun demo dikelompokkan menjadi Keluarga serta Terapis dan admin, dan keterangan Kak Nadia disamakan dengan data demo (25 → 10 anak). Form masuk tidak berubah. `app/(tamu)/masuk/page.tsx`, `components/mode-demo.tsx`. (Wayan, `24d459c`, 13 Nov 2026)
- Bukti untuk dua perubahan di atas: dicek di Chromium 375, 640, 1024, 1280, dan 1440 px. Kontras teks minimal 4,5:1, teks minimal 13 px, tanpa scroll ke samping, tanpa galat console, kartu tidak bertumpuk, dan semua tautan menuju rute yang sama. Akun demo Ibu Sari, Kak Nadia, dan Admin masuk ke `/hari-ini`, `/terapis`, dan `/admin`. tsc, lint, 157 tes, dan build lolos.

## Performa

## Keamanan

- **Header keamanan dasar di semua halaman dan API.** Talkly tidak bisa lagi ditanam di bingkai situs lain (`X-Frame-Options: DENY`, CSP `frame-ancestors 'none'`), browser tidak menebak jenis berkas (`nosniff`), alamat halaman tidak ikut terkirim ke situs lain (`Referrer-Policy`), dan mikrofon serta kamera hanya boleh dipakai Talkly sendiri, fitur lain seperti lokasi dimatikan (`Permissions-Policy`). Tampilan dan fitur tidak berubah. `next.config.ts`. Bukti: header terbaca di `/`, `/api/saya`, dan `/sw.js` pada dev server; di Chromium dengan mikrofon palsu, mikrofon dan kamera tetap bisa dipakai, lokasi ditolak, dan Talkly yang ditanam di iframe tidak termuat; tsc, lint, 153 tes, dan build lolos. (Wayan, `297388d`, 13 Nov 2026)
- **Langganan notifikasi hanya diterima dari layanan push resmi.** Sebelumnya server menerima alamat langganan apa saja, sehingga anggota yang masuk bisa membuat server mengirim permintaan ke alamat sembarang. Sekarang hanya alamat HTTPS milik Google (FCM), Mozilla, Apple, dan Microsoft (WNS) yang diterima; selain itu ditolak dengan pesan "Alamat notifikasi tidak dikenal". Pengingat di Chrome Android tetap berjalan seperti biasa. `app/api/push/route.ts`, `lib/keluarga/push-resmi.ts`. Bukti: tes baru di `uji/stabil.test.ts` (alamat resmi diterima; HTTP, port lain, domain tiruan, alamat internal ditolak); tsc, lint, 156 tes, dan build lolos. (Wayan, `e6247f5`, 13 Nov 2026)

## Dokumentasi

- Changelog ini dibuat. (Wayan, 11 Nov 2026)
- Laporan audit UI/UX `docs/audit-uiux-final.md`: angka kontras, temuan per layar, 10 perbaikan teratas, dan skrip uji pengguna. (Wayan, `0cdf9c7`, 11 Nov 2026)
