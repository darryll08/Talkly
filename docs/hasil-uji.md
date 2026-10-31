# Hasil uji akurasi

Dijalankan 31/10/2026, 18.32.13 WIB dengan `npm run uji:akurasi`. 15 dari 15 skenario sudah diuji.
Skenario percakapan bernaskah, satu naskah campuran bahasa Indonesia dan Jawa (N04). Bukan data anak sungguhan.
Pengukuran dijalankan ulang dari transkrip Scribe yang tersimpan; jeda pembanding diambil dari kunci tiap skenario.

Tabel 1. Ringkasan terhadap target

| Ukuran | Target | Hasil | Lolos |
|---|---|---|---|
| Selisih jeda rata-rata | ≤ 0,5 detik | 0,28 detik (94 jeda) | ya |
| Ketepatan pengenalan ajakan (F1) | ≥ 80% | 84% (presisi 82%, recall 86%) | ya |
| Kesesuaian kategori ajakan | ≥ 80% | 86% dari 115 ajakan | ya |
| Kesesuaian perluasan | ≥ 80% | 85% dari 13 naskah | ya |
| Mutu rekaman sesuai harapan | 15/15 | 15/15 | ya |
| Kasus regresi tertandai | 10/10 | 10/10 (uji/status.test.ts) | ya |
| Rencana bebas kata terlarang | 50/50 | 50/50, aktivitas di luar bank 0, cadangan 0 | ya |

Tabel 2. Per naskah

| Naskah | Isi | Mutu | Ajakan cocok | Kategori sama | Selisih jeda (detik) | Perluasan sistem / kunci |
|---|---|---|---|---|---|---|
| N01 | Video A: buru-buru, tiga kali "ayo bilang" | lolos | 10/11 (sistem 16) | 9/10 | 0,07 | 0 / 0 |
| N02 | Video B: menunggu sampai lima, Raka bersuara | lolos | 8/10 (sistem 13) | 8/8 | 0,25 | 1 / 1 |
| N03 | Menunggu, anak belum menjawab | lolos | 8/8 (sistem 11) | 7/8 | 0,19 | 0 / 0 |
| N04 | Campuran bahasa Indonesia dan Jawa | lolos | 7/8 (sistem 8) | 6/7 | 0,93 | 1 / 1 |
| N05 | Pertanyaan beruntun | lolos | 18/19 (sistem 19) | 18/18 | 0,61 | 0 / 0 |
| N06 | Ayah ikut bicara | lolos | 3/3 (sistem 3) | 3/3 | 0,10 | 1 / 1 |
| N07 | TV menyala keras | ditolak: Suara TV atau musik terlalu keras sehingga percakapan tertutup (sesuai) | | | | |
| N08 | Rekaman terlalu pendek | ditolak: Rekaman baru 22 detik (sesuai) | | | | |
| N09 | Banyak giliran | lolos | 7/11 (sistem 10) | 3/7 | 0,90 | 0 / 0 |
| N10 | Ajakan tanpa tanda tanya | lolos | 10/10 (sistem 10) | 9/10 | 0,18 | 1 / 1 |
| N11 | Anak menjawab cepat | lolos | 13/15 (sistem 13) | 12/13 | 0,10 | 0 / 0 |
| N12 | Banyak perluasan | lolos | 7/7 (sistem 7) | 7/7 | 0,07 | 3 / 3 |
| N13 | Mbak Sri saat makan | lolos | 11/11 (sistem 11) | 9/11 | 0,13 | 0 / 1 |
| N14 | Suara anak bukan kata | lolos | 5/13 (sistem 11) | 2/5 | 0,57 | 0 / 0 |
| N15 | Campuran realistis | lolos | 8/8 (sistem 8) | 6/8 | 0,13 | 0 / 1 |
