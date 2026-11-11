# Changelog: submission-24h → finalist-release

Semua perubahan sesudah tag `submission-24h` (`ee761ff`, 1 November 2026 10.03 WIB) menuju tag `finalist-release`.
Sesuai aturan Finalist Preparation, isinya hanya perbaikan bug, stabilisasi, perapian tampilan, performa, keamanan dasar, dan dokumentasi. Tidak ada fitur baru dan tidak ada perubahan substansi produk.

Perbandingan lengkap: https://github.com/darryll08/Talkly/compare/submission-24h...main

Cara mengisi: setiap anggota menambah baris untuk perubahannya sendiri pada commit yang sama, ditulis dari sudut pengguna, dengan commit, nama, dan bukti (tes atau pemeriksaan). Commit yang belum ada ditulis "belum di-commit" lalu diganti hash-nya.

## Perbaikan bug

- **Rekaman bisa tertahan di "Sedang dinilai" selamanya.** Bila anak bersuara tepat di ujung ajakan orang tua dan orang tua tidak menanggapi dalam 5 detik, mesin ukur gagal (`TypeError`) saat menentukan Momen anak, karena suara anak dicari ulang dari waktu yang sudah dibulatkan. Rekaman lalu tetap berstatus antre dan dicoba ulang tanpa akhir. Sekarang suara anak disimpan langsung saat ajakan dinilai. `lib/ukur/ukur.ts`. Bukti: tes baru di `uji/ukur.test.ts` gagal sebelum perbaikan dan lolos sesudahnya; 153 tes lolos. (Wayan, `4b9aab7`, 11 Nov 2026)
- **Rekaman yang terus gagal diproses kini berhenti dicoba.** Setelah tiga kali gagal, rekaman ditandai "belum bisa dinilai" dengan alasan bahwa kesalahan ada di sistem, bukan cara merekam. Audionya dihapus seperti rekaman ditolak lain, transkrip tetap disimpan untuk ditelusuri, dan status anak naik ke Terapis meninjau. `lib/ukur/proses.ts`, `lib/kontrak/rekaman.ts`. Belum diuji ke database asli. (Wayan, `4b9aab7`, 11 Nov 2026)

## Stabilisasi

## Tampilan

- **Layar "Sedang dinilai" punya batas waktu.** Menit pertama tetap memeriksa hasil setiap 2 detik, lalu setiap 10 detik. Setelah 8 menit layar berhenti menunggu dan menampilkan "Penilaian belum selesai" dengan tombol Cek lagi dan Kembali ke Hari ini. Bila rekaman gagal karena sistem, tips merekam tidak ditampilkan. `app/(ortu)/hasil/[rekamanId]/hasil.tsx`. Dicek di browser lebar 375 px dengan data contoh. (Wayan, `4b9aab7`, 11 Nov 2026)

## Performa

## Keamanan

## Dokumentasi

- Changelog ini dibuat. (Wayan, 11 Nov 2026)
