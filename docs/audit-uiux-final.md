# Audit UI/UX menjelang final

Tanggal 11 November 2026. Dikerjakan pada data contoh (`NEXT_PUBLIC_PAKAI_CONTOH=1`), setelah perapian tampilan yang tercatat di `docs/changelog-final.md`.

## Cakupan dan cara

- **Alur A, keluarga** (Ibu Sari, lebar 360 dan 375 px): O3 Hari ini → O4 Kartu aktivitas → O5 Rekam (layar siap) → O6 Umpan balik → O7 Ditolak → O10 Kemajuan → O12 Profil. Varian sulit: Ibu Bima (data kemajuan belum cukup) dan rekaman ditolak (`6f1d…f7`).
- **Alur B, terapis** (Kak Nadia, 1440 dan 375 px): D3 Minggu ini → D4 Kartu anak (Raka) → D5 Setelah sesi.
- **Pembuka demo:** Beranda dan Masuk.
- **Metode:**
  - *cognitive walkthrough* per langkah (tahu harus apa, melihat kontrol, paham label, paham hasil);
  - heuristik Nielsen (H1–H10) dengan keparahan 0–4;
  - kontras WCAG 2.2 dihitung dari token di `app/globals.css`;
  - target sentuh, ukuran teks, dan scroll samping diukur dengan skrip di halaman;
  - uji 5 detik dinilai dari hierarki visual.
- **Belum dijalankan:**
  - Lighthouse dan axe, karena perlu mengunduh paket baru;
  - HP Android sungguhan;
  - uji dengan orang tua dan terapis sungguhan (lihat skrip di bagian akhir).

## Angka terukur

Tabel 1. Kontras pasangan warna yang dipakai

| Pasangan | Rasio | Hasil | Dipakai di |
|---|---|---|---|
| foreground / background | 14,71 | lolos | teks utama |
| abu / permukaan | 5,70 | lolos | teks sekunder |
| abu / abu-muda | 4,83 | lolos | teks di pil abu |
| teks-di-hijau / hijau-tua | 6,02 | lolos | kepala hijau |
| putih / hijau | 5,24 | lolos | tombol utama |
| oranye-tua / oranye-muda | 5,18 | lolos | galat, laporan keluarga |
| **putih / oranye** | **2,71** | **gagal** (teks dan ikon) | angka langkah O4, O7, O2; centang selesai O3; ikon tombol rekam |
| **teks-di-hijau / hijau** | **3,88** | **gagal untuk teks 14 px** | pil "Diberikan klinik" di beranda |
| **cincin oranye / putih** | **2,71** | **gagal** (penanda non-teks, butuh 3:1) | pil kata "dilaporkan keluarga" O10 dan D4 |
| **lintasan sakelar mati / putih** | **1,41** | **gagal** (butuh 3:1) | semua sakelar: izin, pengingat |
| putih / abu 40% (tombol nonaktif) | 1,89 | dikecualikan WCAG | tombol Masuk sebelum kode diisi |

Tabel 2. Pengukuran lain

| Ukuran | Hasil |
|---|---|
| Scroll samping di 360 px (O3, O4, O6, O7, O10, O12, Masuk, Beranda) | tidak ada |
| Target sentuh < 44 px | avatar menu O3 40×40, baris "Perlu perhatian" D3 setinggi 42, logo 36, tautan dalam kalimat |
| Teks < 13 px | menu bawah 11 px, pil hari D3 11 px, label "Ibu bilang:" 12 px, pil status 12 px |
| Gerak saat `prefers-reduced-motion` | sudah ditangani di `globals.css` (`tekan`, `muncul`, kerangka) |

## Temuan

Keparahan: 4 = menghalangi tugas, 3 = besar, 2 = sedang, 1 = kosmetik. "Selera" = bukan masalah kegunaan.

Tabel 3. Temuan per layar

| # | Layar | Masalah | Heuristik | Kep. | Bukti |
|---|---|---|---|---|---|
| 1 | O12, O2 | Sakelar yang mati hampir tidak terlihat. Izin yang semuanya mati secara bawaan bisa terbaca sebagai "tidak ada pilihan". | H1, WCAG 1.4.11 | 3 | lintasan 1,41:1 |
| 2 | O4, O7, O2, O3, O5 | Angka langkah, centang, dan ikon mikrofon berwarna putih di atas oranye. | WCAG 1.4.3, 1.4.11 | 3 | 2,71:1 |
| 3 | D4 | Urutan baca tidak mengikuti tujuan "persiapan sesi". Elemen paling menonjol adalah kartu angka jeda, sedangkan alasan anak dibahas (pemicu) hanya kotak kecil di kanan atas. Saran sesi ada di kolom kanan, dan kutipan regresi paling bawah. | H8, uji 5 detik | 3 | posisi di layar 1440 |
| 4 | D3 | Kartu angka punya ikon panah serong, tetapi tidak bisa diklik. | H4 | 2 | perapian terakhir |
| 5 | O6 | Angka "6 giliran" berukuran 72 px menjadi hal pertama yang dilihat. Tanpa pembanding, angka itu terbaca sebagai skor, padahal prinsip produk "tanpa skor". | H2 | 2 | kepala O6 |
| 6 | O3 | Dua ajakan utama bersaing. Kartu "Rekam 1 Menit" hijau tua lebih berat daripada kartu "Berikutnya", padahal rekaman hanya 2–3 kali seminggu dan aktivitas setiap hari. | H8 | 2 | O3 375 px |
| 7 | O4 | Tombol "Rekam 1 Menit" dan "Sudah, tanpa rekam" baru terlihat setelah menggulir sekitar 1,5 layar. | H7 | 2 | O4 375 px |
| 8 | O7 | Alasan spesifik (TV keras) diikuti empat tips umum dengan bobot sama. Tips yang relevan tidak disorot. | H9 | 2 | O7 varian TV |
| 9 | O10, D4 | "Dilaporkan keluarga" dibedakan dari "dikonfirmasi terapis" hanya lewat warna cincin oranye. | WCAG 1.4.1, 1.4.11 | 2 | 2,71:1 |
| 10 | O5 | Petunjuk "taruh ponsel di meja" bertentangan dengan tombol "Saya mulai menunggu" yang harus ditekan saat bermain. Tidak dijelaskan bahwa tombol itu boleh dilewati. | H2, H10 | 2 | layar siap dan `perekam.tsx` |
| 11 | D5 | Tidak dijelaskan bahwa menyimpan catatan memicu draf rencana AI. Gaya formulir juga masih gaya lama, berbeda dengan dasbor baru. | H6, H4 | 2 | D5 1440 |
| 12 | Semua | Teks 11–12 px di menu bawah, label kutipan, dan pil. | H8 | 1 | Tabel 2 |
| 13 | Beranda | Pil "Diberikan klinik" teks-di-hijau di atas hijau. | WCAG 1.4.3 | 1 | 3,88:1 |
| 14 | Masuk | Tombol Masuk nonaktif sampai kode diisi 6 karakter, tanpa keterangan. | H1 | 1 | 1,89:1 |
| 15 | Masuk, D3 | Tab memakai `role="tab"` tetapi tidak bisa dipindah dengan tombol panah. | WCAG 2.1.1 | 1 | kode |
| 16 | D4, D5 (data contoh) | Pesan "belum tersedia pada penyedia data" memakai istilah teknis. Hanya muncul di mode data contoh. | H2 | 1 | Alya di data contoh |
| 17 | Beranda | Komposisi kartu bertumpuk di ponsel lebih tinggi dari isinya. | selera | 1 | 375 px |

## 10 perbaikan teratas

Semuanya perapian atau aksesibilitas, tanpa fitur, endpoint, atau tabel baru.

1. **Sakelar mati terlihat jelas.** Di `components/sakelar.tsx`, beri lintasan mati `ring-1 ring-inset ring-abu` (5,70:1). Bukti beres: rasio ≥ 3:1, dan sakelar mati terlihat di screenshot O12.
2. **Angka dan ikon di atas oranye memakai teks gelap.**
   - Ganti `text-white` menjadi `text-foreground` (5,85:1) di `app/(ortu)/aktivitas/[itemId]/kartu.tsx:120`, `app/(ortu)/hasil/[rekamanId]/hasil.tsx:303`, dan `app/(ortu)/mulai/page.tsx:75`.
   - Lakukan hal yang sama untuk centang di `app/(ortu)/hari-ini/page.tsx:110` dan `tombolRekam` di `lib/gaya.ts`.
   - Bukti beres: tidak ada lagi `bg-oranye … text-white` di `grep`.
3. **D4 dibuka dengan "Kenapa dibahas".** Di `app/(terapis)/terapis/anak/[id]/kartu.tsx`, buat satu blok paling atas berisi pemicu status, saran sesi, dan kutipan regresi bila ada. Angka strategi pindah ke bawahnya. Bukti beres: uji 5 detik pada D4 menyebut alasan anak dibahas.
4. **Hapus ikon panah di kartu angka D3**, atau jadikan kartu itu tautan ke daftar yang tersaring. Yang paling aman: hapus ikonnya. File: `app/(terapis)/terapis/page.tsx` (`KartuAngka`).
5. **O6 dibuka dengan pujian, angka menjadi pendukung.** Kepala O6 berisi "Yang sudah bagus". Angka giliran pindah ke satu baris kecil, misalnya "6 kali bergantian bicara dalam 58 detik". File: `app/(ortu)/hasil/[rekamanId]/hasil.tsx`.
6. **O3 punya satu ajakan utama.** Kartu "Berikutnya" diberi tombol utama "Mulai aktivitas". Kartu "Rekam 1 Menit" diturunkan bobotnya menjadi kartu putih dengan tombol rekam oranye. File: `app/(ortu)/hari-ini/page.tsx`.
7. **Bilah aksi lengket di O4.** "Rekam 1 Menit" dan "Sudah, tanpa rekam" menempel di atas menu bawah. File: `app/(ortu)/aktivitas/[itemId]/kartu.tsx`.
8. **O7 menyorot tips yang sesuai alasan.** TV → tip 1, terlalu pendek → tip 4, terputus → tip 3, suara kurang → tip 2. Tips lain diringkas. File: `app/(ortu)/hasil/[rekamanId]/hasil.tsx` (`Ditolak`).
9. **"Dilaporkan keluarga" tidak bergantung pada warna saja.** Pakai cincin `ring-oranye-tua` (5,85:1) dan ikon pena kecil. File: `app/(ortu)/kemajuan/page.tsx` dan `app/(terapis)/terapis/anak/[id]/kartu.tsx`.
10. **Ukuran teks minimal 13 px** untuk label menu bawah, label kutipan, dan pil status. File: `components/nav-ortu.tsx`, `hasil.tsx`, `components/terapis/status-anak.tsx`. Sekalian ganti teks pil beranda menjadi putih (5,24:1).

Dicatat untuk nanti, bukan untuk fase final:
- tab dengan navigasi tombol panah (temuan 15),
- perapian gaya formulir D1, D2, D5, dan D6 (temuan 11),
- penjelasan opsional untuk tombol "Saya mulai menunggu" (temuan 10). Perbaikan kecil ini juga boleh masuk final bila sempat.

## Status perbaikan (11 November 2026)

Kesepuluh perbaikan teratas sudah dikerjakan; belum di-commit saat catatan ini ditulis.
- Kontras: angka dan ikon di atas oranye 2,71 → 5,85; sakelar mati 1,41 → 5,70 (lintasan bergaris abu); penanda "dilaporkan keluarga" memakai cincin oranye tua (5,85) dan ikon pena; pil beranda 3,88 → 5,24.
- Teks minimal 13 px di menu bawah, label kutipan O6, pil status, dan pil hari D3.
- D3: ikon panah di kartu angka dihapus.
- D4: blok "Yang perlu dibahas" di paling atas (pemicu status, kutipan regresi, saran sesi); angka strategi di bawahnya.
- O3: tombol "Mulai aktivitas" di kartu Berikutnya; kartu Rekam menjadi kartu putih dengan keterangan 2–3 kali seminggu.
- O4: bilah aksi lengket di atas menu bawah (Rekam 1 Menit, Sudah tanpa rekam).
- O6: judul "Bagus, Ibu!", angka giliran menjadi pil kecil.
- O7: tips yang sesuai alasan tolak disorot sebagai "Coba ini dulu".
- Dicek di browser 375 px dan 1440 px dengan data contoh; tsc, lint, 153 tes, dan build lolos.

Belum dikerjakan: temuan 10, 11, 14, 15, 16, 17; target sentuh avatar (40 px) dan baris "Perlu perhatian" (42 px).

## Kriteria gagal: keadaan sebelum perbaikan

| Kriteria | Keadaan |
|---|---|
| Tidak ada teks < 4,5:1 | **gagal**: putih di oranye 2,71; pil beranda 3,88 (perbaikan 2 dan 10) |
| Tidak ada target sentuh < 44 px | hampir lolos: avatar 40, baris 42, logo 36 |
| Tidak ada scroll samping di 360 px | lolos |
| O3 lolos uji 5 detik | lolos dengan catatan (temuan 6) |
| D4 terbaca ≤ 3 menit | belum diukur dengan orang; risiko dari urutan baca (temuan 3) |

Bertentangan dengan perapian terakhir: ikon panah di kartu angka D3 (temuan 4) dan grafik pil di D4 yang menjadikan angka jeda elemen paling menonjol (temuan 3). Keduanya ditambahkan pada perapian tampilan 11 November.

## Skrip uji dengan pengguna

**Peserta:** 3–5 orang tua dengan anak usia 1–4 tahun, memakai HP Android sendiri, ditambah 1 terapis wicara atau mahasiswa terapi wicara. Masuk lewat akun demo di https://talkly-orcin.vercel.app/masuk.

**Tugas orang tua** (tanpa dibantu, peserta diminta berpikir sambil bicara):
1. "Anda baru membuka aplikasi. Apa yang perlu Anda lakukan hari ini?" Catat jawaban dalam 5 detik pertama.
2. "Kerjakan aktivitas berikutnya dan tandai selesai tanpa merekam."
3. "Rekam satu menit bermain." Cukup sampai layar merekam; catat apakah tombol "Saya mulai menunggu" dipahami.
4. Buka umpan balik contoh. "Apa yang sudah bagus, dan apa yang dicoba besok?"
5. "Matikan izin agar terapis tidak bisa mendengar rekaman Anda."

**Tugas terapis** (dengan stopwatch):
1. "Sesi dengan Raka 10 menit lagi. Ceritakan apa yang perlu Anda bahas." Catat waktu sampai jawabannya lengkap; target ≤ 3 menit.
2. "Anak mana yang paling perlu perhatian minggu ini, dan kenapa?"

**Yang dicatat per tugas:** berhasil atau tidak, waktu, titik ragu (berhenti lebih dari 3 detik atau bertanya), dan kalimat yang salah dipahami.
