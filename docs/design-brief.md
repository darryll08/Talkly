# Design brief: tampilan aplikasi orang tua Talkly

Audit 31 Okt 2026 terhadap build lokal (`NEXT_PUBLIC_PAKAI_CONTOH=1`, `NEXT_PUBLIC_DEMO=1`). Lingkup: layar O, beranda, dan sistem tampilan bersama. Dasbor terapis (Aditya) belum diaudit karena masih dikerjakan, tetapi semua perubahan sistem di bawah aman untuk layar D dan otomatis ikut memperbaikinya.

**Bahan yang dipakai:**
- Screenshot 24 keadaan layar di 390×844 dan 1440×900: `docs/layar/audit/<layar>-390.png` dan `-1440.png`.
- Rancangan Lampiran L1–L31 dari proposal v19: `docs/layar/lampiran/`.
- Kode `app/globals.css`, `lib/gaya.ts`, dan `components/`.

**Metode:**
- Inventaris token.
- Kontras dihitung dengan rumus WCAG 2.2, lalu dicocokkan dengan Lighthouse a11y per rute.
- Heuristik Nielsen.
- Walkthrough tiga tugas: Ibu Sari merekam sampai membaca umpan balik; Mbak Sri menandai "Sudah"; juri membuka URL dari laptop lalu masuk mode demo.
- Perbandingan berdampingan dengan Lampiran.
- Skill ui-ux-pro-max dipakai untuk menguji usulan. Paletnya (cyan) ditolak karena bertentangan dengan merek. Prinsip aksesibilitas dan arah tipografinya dipakai.

---

## 1. Lima temuan terbesar

### T1. Tombol utama gagal kontras di semua layar (P0)
- **Bukti:** teks putih di atas `--hijau #3a9d8f` = **3,28:1**, padahal batas AA untuk teks 16 px semibold adalah 4,5:1. Lighthouse menandai `color-contrast` di 8 dari 10 rute yang diuji. Skor a11y: beranda 96, /hari-ini 95, /kemajuan 95, /profil 96, /pesan 96.
- **Terkena:** semua `tombolUtama`, `Pil` yang terpilih, gelembung "versi anak" di O6, dan gelembung pesan milik sendiri.
- **Rujukan:** Lampiran memakai tombol **#177a65**, yang menghasilkan **5,24:1**. Jadi perbaikannya sekaligus mengembalikan warna rancangan yang sudah dinilai juri.
- Contoh: `audit/O3-hari-ini-390.png`, `docs/layar/lampiran/L13-O3.png`.

### T2. Di laptop, aplikasi terlihat seperti kolom kosong (P0, karena juri membuka dari laptop)
- **Bukti:** `audit/beranda-1440.png` dan `audit/O3-hari-ini-1440.png` menunjukkan kolom 448 px mengambang di bidang abu seluas 1440 px. Garis nav bawah membentang selebar layar sementara ikonnya mengumpul di tengah.
- Dua pertiga layar kosong, tanpa penjelasan apa yang sedang dilihat. Inilah kesan "basic" yang paling kuat.
- **Walkthrough juri:** setelah membuka URL, juri tidak tahu bahwa ini aplikasi ponsel, dan tidak ada jalan kembali ke pilihan persona selain lewat beranda.

### T3. Oranye dipakai sebagai teks dan latar tanpa cukup kontras (P0)
- **Bukti:**
  - `--oranye-tua #b85f1e` di `--oranye-muda`: **4,00:1** (kotak galat, label "Yang sudah bagus", "Kata Raka").
  - `#b85f1e` di putih: **4,47:1** (tombol "Cabut akses", kata dilaporkan di O10).
  - Keterangan `text-oranye-tua/90` di kemajuan: **3,44:1**.
  - Tombol putar Momen putih di `#e8833a`: **2,71:1**. Ikon juga butuh minimal 3:1.

### T4. Hierarki datar: semua blok berbobot sama (P1)
- **Bukti:** `audit/O3-hari-ini-390.png` berisi 7 blok kartu putih berurutan dengan bayangan yang sama (pesan, Berikutnya, aktivitas lain, tombol Rekam, 4 pintasan, minggu ini). Tugas utama, yaitu buka aktivitas lalu rekam, bersaing dengan pintasan.
- Lampiran L13 menggabungkan rekam ke dalam kartu Berikutnya dan memakai bilah 7 hari ("3–4 hari seminggu sudah cukup").
- Label kartu Berikutnya `text-white/80` di gradien hijau: **2,65:1**.
- Pola yang sama di O2 dan O12 (`audit/O2-mulai-390.png`): tiap sakelar izin memuat 3 paragraf 13–14 px. Satu layar penuh teks kecil sebelum orang tua bisa lanjut.

### T5. Tipografi tidak punya skala: 21 ukuran teks dan isi terlalu kecil (P1)
- **Bukti inventaris:** 21 ukuran berbeda (11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 27, 28, 32, 34, 44, 48, 56 px, xs, sm, base), hampir semuanya nilai `text-[..px]` yang ditulis manual. Ukuran paling sering dipakai adalah **15 px (40 kali)** dan 13 px (27 kali).
- Untuk orang tua yang membaca sambil memegang anak, isi utama sebaiknya **17 px**, sesuai proporsi Lampiran L14 dan L17.
- Label nav bawah 11 px.
- Font Geist terasa teknis dan dingin. Lampiran memakai grotesk yang lebih hangat.

**Hal yang sudah baik dan dipertahankan:** tidak ada scroll samping di 48 screenshot, tidak ada galat console, target sentuh ≥44 px, fokus terlihat, ada `prefers-reduced-motion`, tidak ada warna merah, dan O7 serta O10 sudah jelas (`audit/O7-ditolak-390.png`, `audit/O10-kemajuan-390.png`).

---

## 2. Perubahan sistem

Semua perubahan lewat `app/globals.css`, `lib/gaya.ts`, dan `components/`. Layar tidak menulis kelas warna atau ukuran sendiri (K14).

### 2.1 Warna

Nilai baru diambil dari piksel Lampiran (L13, L15, L17). Semua angka di kolom kontras sudah dihitung.

| Token | Sekarang | Baru | Kontras kunci | Dipakai untuk |
|---|---|---|---|---|
| `--background` | `#f3f6f5` | **`#f8f6f2`** | teks 14,71:1 | latar hangat seperti Lampiran |
| `--permukaan` | `#ffffff` | `#ffffff` | — | kartu |
| `--garis` | `rgb(31 42 40/.08)` | **`rgb(43 40 35/.10)`** | — | pemisah |
| `--foreground` | `#1f2a28` | **`#24221e`** | 14,71:1 di latar | teks utama |
| `--hijau` | `#3a9d8f` | **`#177a65`** | putih di atasnya 5,24:1; sebagai teks di latar 4,85:1 | tombol utama, angka terukur, pil terpilih |
| `--hijau-tua` | `#2c7a6f` | **`#0e5a4b`** | 7,53:1 di latar; 7,09:1 di hijau-muda | teks hijau, tautan, tekan |
| `--hijau-muda` | `#e6f4f1` | **`#e3f3ee`** | — | latar Coba besok, label kata |
| `--hijau-lembut` (baru) | — | **`#3a9d8f`** | tidak boleh menjadi latar teks | grafik, cincin, bilah minggu, ilustrasi. Warna merek lama tetap hidup di sini |
| `--oranye` | `#e8833a` | `#e8833a` | teks gelap di atasnya 5,85:1 | isian dekoratif saja: titik merekam, garis kata dilaporkan, pita suara anak |
| `--oranye-tua` | `#b85f1e` | **`#a14d14`** | 5,18:1 di oranye-muda; 5,85:1 di putih | teks oranye, latar tombol Momen (ikon putih 5,85:1) |
| `--oranye-muda` | `#fdf0e6` | **`#fcefe3`** | — | pujian, laporan keluarga, galat |
| `--abu` | `#66726f` | **`#6b665e`** | 5,28:1 di latar; 5,70:1 di putih; 4,83:1 di abu-muda | teks sekunder dan placeholder |
| `--abu-muda` | `#e9eeec` | **`#efece6`** | — | kerangka, tombol nonaktif, inisial terapis |

Aturan baru di `globals.css` (komentar token): **opasitas tidak boleh dipakai pada warna teks** (`text-white/80`, `text-oranye-tua/90`), karena itulah sumber 3 dari 5 kegagalan kontras.

### 2.2 Tipografi

- **Font:** ganti Geist dengan **Plus Jakarta Sans** (Google Fonts lewat `next/font/google`, `subsets: ["latin"]`, berat 400/500/600/700/800). Satu keluarga untuk judul dan isi, jadi tidak ada pasangan font yang perlu dijaga.
  - Alasannya: grotesk yang hangat dan dirancang untuk Jakarta, sehingga mudah dibaca di layar ponsel Android kelas menengah dan dekat dengan rasa Lampiran.
  - Cadangan bila ada masalah render: **Atkinson Hyperlegible**, rekomendasi ui-ux-pro-max untuk kesehatan dan aksesibilitas.
  - Catatan: Plus Jakarta Sans adalah pilihanku, bukan hasil pencarian database skill.
  - Geist Mono tetap dipakai untuk kode undangan dan kode masuk.
- **Skala** sebagai token Tailwind di `@theme` (`--text-*` dengan line-height), menggantikan semua `text-[..px]`:

| Token | Ukuran / tinggi baris | Berat | Pakai untuk |
|---|---|---|---|
| `text-label` | 13 / 18 | 600, huruf kapital, tracking .06em | label seksi saja |
| `text-kecil` | 15 / 22 | 400–500 | teks sekunder, keterangan, nav |
| `text-isi` | **17 / 26** | 400 | isi utama, langkah, umpan balik |
| `text-sub` | 20 / 26 | 700 | judul kartu |
| `text-judul` | 28 / 32 | 800, tracking −.02em | judul halaman |
| `text-tampilan` | 44 / 46 | 800, `tabular-nums` | angka terukur, kata target, timer |

- Label nav bawah naik ke 12 px semibold. Tinggi nav tetap 56 px.

### 2.3 Bentuk, bayangan, jarak

- Radius hanya tiga: `rounded-xl` (12, isian dan pil kecil), `rounded-2xl` (16, kartu dan tombol), `rounded-full`. `rounded-3xl` dan `rounded-[20px]` dihapus. Gelembung chat memakai `rounded-2xl` dengan satu sudut `rounded-br-md`.
- Bayangan kartu dibuat lebih hangat: `0 1px 2px rgb(43 40 35/.05), 0 6px 20px rgb(43 40 35/.05)`. Kartu juga diberi garis `ring-1 ring-garis` agar terbaca di layar ponsel yang terang.
- Jarak antar seksi halaman seragam `space-y-6` (24 px). Di dalam kartu `space-y-3`. Hindari campuran `space-y-4/5`.

### 2.4 Komponen yang diubah

| Komponen | Perubahan |
|---|---|
| `lib/gaya.ts` | `tombolUtama` memakai `bg-hijau` baru dan `text-isi font-semibold`; `tombolKedua` memakai `ring-hijau/40 text-hijau-tua`; `kartu` ditambah `ring-1 ring-garis`; kelas baru `judulHalaman = text-judul`, `teksIsi`, `teksKecil`; `kotakGalat` memakai `text-oranye-tua` baru. |
| `NavOrtu` | Dibatasi `max-w-md mx-auto` (border tidak membentang di laptop); label 12 px; tab aktif diberi pil latar `bg-hijau-muda` di belakang ikon seperti Lampiran L13. |
| `KepalaHalaman` | Teks "Kembali" diganti nama tujuan bila ada ("‹ Hari ini", sesuai L14/L17), lewat prop `labelKembali`. |
| `Sakelar` | Keterangan panjang dipindah ke `<details>` "Rincian" (judul + `wajib_untuk` tetap terlihat). Progressive disclosure, dari temuan T4. |
| `Inisial` | Inisial terapis memakai `abu-muda` + `foreground`, tidak lagi abu di abu (sekarang 4,26:1). |
| **Baru:** `components/bingkai-desktop.tsx` | Lihat 2.5. |
| **Baru:** `components/pita-ilustrasi.tsx` | SVG statis "Ibu: 'lihat… bebek!' → menunggu 4 detik → Raka: 'bek!'" dari sampul L1. Dipakai di beranda dan panel desktop. Tidak beranimasi. |

### 2.5 Tampilan laptop untuk juri (menjawab T2)

Ditangani di level layout. Isi halaman tidak didesain ulang.
- Pada `lg:` (≥1024 px), `BingkaiOrtu` menampilkan aplikasi dalam **bingkai ponsel** 390×844 (radius 44 px, garis gelap 10 px, bayangan dalam) di tengah-kanan. Isi menggulir di dalam bingkai, dan nav menempel di bawah bingkai.
- Di kiri ada **panel penjelasan** 360 px:
  - logo dan nama Talkly;
  - kode dan nama layar yang sedang dibuka ("O3 · Hari ini") dengan satu kalimat dari keterangan Lampiran;
  - pemilih persona demo (Ibu Sari, Mbak Sri, Kak Nadia), sehingga juri bisa berganti tanpa kembali ke beranda;
  - label "Data contoh · hanya bagian menunggu yang dipercepat".
- Pemetaan rute ke kode layar disimpan di satu objek di `components/bingkai-desktop.tsx`.
- Di bawah `lg:` tidak ada yang berubah.

---

## 3. Selisih per layar

Hanya yang berbeda dari sistem. Prioritas: P0 = sebelum I2, P1 = sebelum I3, P2 = bila ada waktu.

| Layar | Masalah (bukti) | Perubahan | Prio | Menit |
|---|---|---|---|---|
| Semua | T1, T3, T5 | Token warna, skala teks, dan font di 2.1–2.3; ganti `text-[..px]` dengan token | P0 | 60 |
| Beranda | Logo, judul, deskripsi, dan tombol tanpa gambaran produk (`beranda-390`) | Tambah `pita-ilustrasi` di bawah judul; deskripsi `text-isi`; persona demo tetap di bawah | P0 | 30 |
| Laptop (semua) | T2 (`*-1440`) | `bingkai-desktop` (2.5) | P0 | 60 |
| O3 Hari ini | 7 blok setara, label 2,65:1 (`O3-hari-ini-390`) | Kartu Berikutnya menjadi `bg-hijau` polos (tanpa gradien), label putih penuh, dan baris "Rekam 1 Menit" ada **di dalam** kartu (L13). Tombol Rekam terpisah dihapus. 4 pintasan jadi satu baris ikon-label 4 kolom tanpa kartu. "Minggu ini" menjadi bilah 7 segmen (`--hijau-lembut`) berisi `hari_aktif_minggu_ini` + "3–4 hari seminggu sudah cukup." | P0 | 45 |
| O4 Kartu aktivitas | Langkah 15–16 px, nomor kecil dalam lingkaran (`O4-aktivitas-390`) | Langkah `text-isi`, nomor besar hijau tanpa lingkaran (L14). "Kalau anak mencoba / belum mau" tetap dua kotak (spesifikasi prompt), isi `text-kecil`. Kata target `text-tampilan` 36 px | P1 | 20 |
| O5 Rekam (siap) | Judul ganda "Rekam 1 Menit" di kepala dan h1 (`O5-rekam-siap-390`) | h1 diganti judul aktivitas; kepala tanpa judul | P1 | 10 |
| O5 Rekam (merekam) | Cincin 220 px, timer 44 px, peringatan Wake Lock oranye mencolok (`O5-rekam-merekam-390`) | Cincin 260 px dengan jalur `--abu-muda` dan isian `--hijau-lembut`; timer `text-tampilan` 56 px. Dua kartu kecil "Kata target" dan "Setelah mengajak · hitung sampai 5" (L15). Peringatan menjadi teks `text-kecil` abu dengan ikon info, bukan kotak oranye. **Tanpa animasi baru.** | P1 | 25 |
| O5b Dinilai | Setengah layar kosong (`O5b-dinilai-390`) | Tambah satu kalimat penenang di bawah kartu: "Biasanya 10–15 detik. Audio tidak diputar ke siapa pun." | P2 | 5 |
| O6 Umpan balik | Angka "6" 56 px terbaca seperti skor; tiga kotak berwarna penuh (`O6-umpan-balik-390`) | Angka giliran jadi 44 px sebaris dengan "giliran percakapan dalam 58 detik" (tetap besar sesuai prompt, tidak dominan). Kotak pujian dan saran menjadi seksi dengan garis aksen kiri 4 px (oranye/hijau) di kartu putih (L17). Versi anak tetap gelembung hijau. Tombol Momen memakai `--oranye-tua` | P1 | 30 |
| O2 Mulai / O12 Profil | Dinding teks izin (`O2-mulai-390`, `O12-profil-390`) | `Sakelar` dengan `<details>` (2.4); kalimat pembuka O2 dipendekkan menjadi satu baris | P1 | 20 |
| O9 Catatan malam | Form panjang; 6 pertanyaan terlihat setara (`O9-catatan-malam-390`) | Kelompokkan: "Hari ini" (kata, dibanding, kondisi, regresi) lalu "Tambahan · boleh dikosongkan" (berbeda, pesan) di bawah garis. Tombol Simpan menempel di bawah (`sticky bottom`) | P2 | 20 |
| O10 Kemajuan | Teks oranye 3,44:1; kata dilaporkan 4,47:1 | Teks oranye pakai token baru; kata dilaporkan bergaris `--oranye` dengan teks `--foreground`. Batang memakai `--hijau-lembut` dan batang terakhir `--hijau` | P0 | 10 |
| O11 Keluarga | Sudah cukup baik (`O11-keluarga-390`) | Hanya token | — | 0 |
| Pesan | Gelembung milik sendiri putih di hijau lama | Ikut token; tidak ada perubahan tata letak | — | 0 |
| O1 / O1c | Pratinjau undangan berupa tiga baris inisial (`O1-gabung-pratinjau-390`) | Pratinjau menjadi satu kartu: nama anak `text-sub`, terapis dan klinik `text-kecil` di bawahnya (L5) | P2 | 15 |
| Ikon aplikasi | Ujung tetes besar terpotong (`public/icon-512.png`, logo di `beranda-1440`) | Gambar ulang `public/logo.svg` sesuai L1 (celah putih merata, tanpa takik), lalu generate ulang PNG | P2 | 15 |

**Total P0 ±3,5 jam, P1 ±1,7 jam, P2 ±1 jam.**

---

## 4. Yang sengaja tidak diubah

- **Merek:** hijau dan oranye tetap, hanya digelapkan agar lolos AA, mengikuti nilai Lampiran sendiri. Tidak ada merah, tidak ada mode gelap, tidak ada gradien ungu atau neon (anti-pola ui-ux-pro-max).
- **O5 tetap tenang:** tidak ada animasi gelombang suara atau pulsa baru, karena anak tidak boleh tertarik ke layar.
- **Tanpa skor dan tanpa peringkat:** angka giliran dikecilkan justru agar tidak terbaca sebagai skor.
- **Alur, rute, dan kontrak data tetap:** tidak ada field baru yang diminta dari A. Judul berupa kalimat ala Lampiran L17 ("Ibu menunggu, Raka menjawab") **tidak** dipakai, karena layar tidak boleh merangkai kalimat sendiri dan kontrak tidak punya field itu. Bila ingin dipakai, A harus menambahkannya ke templat.
- **"Kalau anak mencoba / belum mau" di O4:** Lampiran L14 memakai akordion, tetapi prompt B2.2 meminta dua kotak berdampingan. Prompt dipertahankan.
- **Mikro-interaksi:** `.tekan`, `.muncul`, dan `--ease-pegas` sudah baik.

## 5. Bertentangan dengan Lampiran

| Lampiran | Aplikasi sekarang | Keputusan |
|---|---|---|
| Tombol `#177a65`, latar `#f8f6f2` | `#3a9d8f`, `#f3f6f5` | Ikut Lampiran (T1) |
| O3 tanpa pesan dalam kartu bergradien; rekam di dalam kartu Berikutnya | Kartu gradien + tombol Rekam terpisah | Ikut Lampiran (O3 di tabel) |
| O5 bilah kemajuan datar, bukan cincin | Cincin 60 detik | Ikut prompt B2.3 (cincin + penanda 40 detik) |
| O6 judul berupa kalimat | Angka giliran | Ikut prompt dan kontrak (lihat bagian 4) |

---

## 6. Daftar cek penerimaan

Jalankan setelah perubahan, lalu ulangi screenshot ke `docs/layar/audit/` dengan akhiran `-sesudah`.

- [ ] Kontras ≥4,5:1 untuk semua teks dan ≥3:1 untuk ikon yang bermakna. Lighthouse a11y **≥98** di 10 rute: `/`, `/gabung`, `/hari-ini`, `/aktivitas/<id>`, `/rekam`, `/hasil/<id>`, `/catatan-malam`, `/kemajuan`, `/profil`, `/pesan`. Tidak boleh ada `color-contrast` gagal (sebelum: 95–96, 8 dari 10 gagal).
- [ ] `document.documentElement.scrollWidth === innerWidth` di 390 px untuk 24 keadaan layar.
- [ ] `grep -rn 'text-\[' app/(ortu) app/page.tsx components` kosong (semua lewat token skala).
- [ ] `grep -rnE 'text-(white|oranye-tua|hijau-tua)/[0-9]' app components` kosong (tidak ada opasitas pada warna teks).
- [ ] `grep -rn 'red-' app components lib` kosong; `grep -rn 'bg-hijau px-5 py-4' app components` kosong.
- [ ] Di 1440 px, juri bisa berganti persona dari panel kiri tanpa kembali ke beranda, dan kode layar di panel sesuai rute.
- [ ] O5 merekam: tidak ada elemen yang beranimasi selain cincin dan titik merekam yang sudah ada.
- [ ] Satu orang tua di luar tim membaca O4 dan menceritakan ulang tiga langkahnya dalam ±15 detik. Catat hasilnya di `docs/status.md`.
- [ ] `npm run periksa` hijau.

**Brief ini dianggap gagal bila:** ada warna merek baru atau merah, ada animasi baru di O5, ada kontras yang turun, atau ada layar yang menulis kelas warna atau ukuran di luar token.
