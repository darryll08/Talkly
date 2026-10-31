// 15 naskah rekaman uji akurasi (A7.1, proposal 4.4). Setiap baris punya jeda sesudahnya (detik),
// jadi kunci jawaban (ajakan, kategori, jeda perkiraan, perluasan, giliran, mutu) dihitung dari naskah.
// Jeda yang dipakai sebagai kebenaran akhir tetap jeda manual dari Audacity (jeda_manual_s di berkas kunci).
// Aturan kunci sengaja mengikuti definisi proposal 4.1, bukan kode lib/ukur, supaya keduanya bisa dibandingkan.

export type Penutur = "ibu" | "anak" | "ayah" | "sri";
export type Baris = {
  s: Penutur;
  teks: string;
  /** Diam sesudah baris ini sebelum baris berikutnya dimulai (detik). */
  jeda: number;
  /** Ibu/perekam mengulang ucapan anak sambil menambah kata. */
  perluasan?: true;
};
export type Naskah = {
  id: string;
  judul: string;
  tujuan: string;
  perekam: "ibu" | "sri";
  /** Petunjuk tambahan untuk tim saat merekam. */
  catatan?: string;
  /** Hasil mutu yang diharapkan. */
  harap_ditolak?: "durasi" | "bising";
  /** Detik tambahan setelah baris terakhir sampai tombol berhenti ditekan. */
  ekor: number;
  baris: Baris[];
};

export const KATA_TARGET = ["bebek", "mamam", "lagi", "mau", "buka"];
const AMBANG = 4;
const DETIK_PER_KATA = 0.38;
const DURASI_ANAK = 0.5;

export const NASKAH: Naskah[] = [
  {
    id: "N01",
    judul: "Video A: buru-buru, tiga kali \"ayo bilang\"",
    tujuan: "Jeda pendek ±1,2 detik dan suruhan beruntun → saran",
    perekam: "ibu",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Nah, Raka, sini. Kita mandi dulu ya, bawa bebeknya.", jeda: 0.5 },
      { s: "ibu", teks: "Ini apa?", jeda: 1.2 },
      { s: "ibu", teks: "Bebek. Ini bebek.", jeda: 0.4 },
      { s: "ibu", teks: "Ayo bilang bebek.", jeda: 0.8 },
      { s: "ibu", teks: "Ayo bilang, be-bek.", jeda: 0.8 },
      { s: "ibu", teks: "Ayo bilang dong, bebek.", jeda: 1.2 },
      { s: "anak", teks: "eh", jeda: 0.3 },
      { s: "ibu", teks: "Iya, bebek. Sekarang airnya dulu ya, panas nggak?", jeda: 1.1 },
      { s: "ibu", teks: "Nggak panas kok. Tangannya mana?", jeda: 1.2 },
      { s: "ibu", teks: "Nah, gitu. Bebeknya mau ikut mandi?", jeda: 1.2 },
      { s: "ibu", teks: "Mau ya. Taruh sini bebeknya, di air.", jeda: 0.6 },
      { s: "ibu", teks: "Raka mau lagi airnya?", jeda: 1.3 },
      { s: "ibu", teks: "Lagi? Ini, ibu siram lagi.", jeda: 0.6 },
      { s: "ibu", teks: "Wah basah semua. Bebeknya juga basah, lihat.", jeda: 1.2 },
      { s: "ibu", teks: "Yuk sabunan dulu, kakinya mana kaki?", jeda: 1.1 },
      { s: "ibu", teks: "Nah ini kakinya. Gosok gosok gosok.", jeda: 0.5 },
      { s: "ibu", teks: "Udah, bilas ya. Bebeknya dibilas juga?", jeda: 1.2 },
      { s: "ibu", teks: "Iya dibilas. Udah bersih, ayo handukan.", jeda: 0.5 },
    ],
  },
  {
    id: "N02",
    judul: "Video B: menunggu sampai lima, Raka bersuara",
    tujuan: "Jeda ±4,8 detik, anak merespons, satu perluasan → pujian, versi anak, Momen anak",
    perekam: "ibu",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Raka, lihat. Ibu bawa apa nih?", jeda: 1.5 },
      { s: "ibu", teks: "Hmm, apa ya. Kuning, bisa ngapung.", jeda: 0.6 },
      { s: "ibu", teks: "Bebek?", jeda: 4.8 },
      { s: "anak", teks: "bek", jeda: 0.6 },
      { s: "ibu", teks: "Iya, bebek! Bebek mandi.", jeda: 0.4, perluasan: true },
      { s: "ibu", teks: "Bebeknya mau berenang. Plung.", jeda: 1.5 },
      { s: "ibu", teks: "Mau lagi?", jeda: 4.5 },
      { s: "anak", teks: "agi", jeda: 0.6 },
      { s: "ibu", teks: "Lagi. Plung lagi.", jeda: 1.2 },
      { s: "ibu", teks: "Sekarang airnya. Ibu siram ya, siap?", jeda: 1.4 },
      { s: "ibu", teks: "Satu, dua, tiga. Byur.", jeda: 1.5 },
      { s: "ibu", teks: "Dingin ya? Hehe.", jeda: 1.3 },
      { s: "ibu", teks: "Nah, bebeknya ditaruh mana?", jeda: 4.6 },
      { s: "ibu", teks: "Di sini aja ya, di pinggir. Bebek tunggu sini.", jeda: 0.6 },
      { s: "ibu", teks: "Yuk sabunan dulu. Tangan kanan dulu.", jeda: 0.6 },
      { s: "ibu", teks: "Tangan kiri. Pinter.", jeda: 0.6 },
    ],
  },
  {
    id: "N03",
    judul: "Menunggu, anak belum menjawab",
    tujuan: "Ajakan dengan hening ≥ 4 detik tanpa suara anak → menunggu cukup",
    perekam: "ibu",
    ekor: 1.5,
    baris: [
      { s: "ibu", teks: "Raka mau mamam apa? Nasi atau roti?", jeda: 5.2 },
      { s: "ibu", teks: "Hmm, nasi ya. Ibu ambilin nasi.", jeda: 0.6 },
      { s: "ibu", teks: "Mau sayurnya juga?", jeda: 4.8 },
      { s: "ibu", teks: "Dikit aja ya, wortel.", jeda: 1.3 },
      { s: "ibu", teks: "Ini sendoknya. Buka mulutnya, aaa.", jeda: 4.5 },
      { s: "ibu", teks: "Nah, gitu. Enak?", jeda: 5 },
      { s: "ibu", teks: "Kunyah kunyah. Pelan pelan aja.", jeda: 1.5 },
      { s: "ibu", teks: "Mau lagi?", jeda: 4.6 },
      { s: "ibu", teks: "Oke, satu sendok lagi terus minum.", jeda: 0.7 },
      { s: "ibu", teks: "Gelasnya Raka yang biru, sini ibu pegangin.", jeda: 1 },
    ],
  },
  {
    id: "N04",
    judul: "Campuran bahasa Indonesia dan Jawa",
    tujuan: "Uji STT pada ucapan campuran; ajakan berbahasa Jawa tetap dikenali dari tanda tanya dan hening",
    perekam: "ibu",
    catatan: "Ucapkan dengan logat sehari-hari, tidak perlu dibuat baku.",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Le, ayo maem sik. Iki opo?", jeda: 4.4 },
      { s: "anak", teks: "mam", jeda: 0.5 },
      { s: "ibu", teks: "Iyo, mamam. Mamam sego.", jeda: 0.5, perluasan: true },
      { s: "ibu", teks: "Sego karo endhog. Enak to?", jeda: 1.4 },
      { s: "ibu", teks: "Mau lagi, Le?", jeda: 1.1 },
      { s: "ibu", teks: "Iki, sesendok meneh. Aaa.", jeda: 1.5 },
      { s: "ibu", teks: "Wis entek. Pinter tenan.", jeda: 0.6 },
      { s: "ibu", teks: "Saiki ngombe yo. Gelase endi?", jeda: 4.7 },
      { s: "ibu", teks: "Kae lho, sing ijo. Dijupuk, Le.", jeda: 1.3 },
      { s: "ibu", teks: "Nah, iki. Buka tutupe dhisik.", jeda: 4.3 },
      { s: "anak", teks: "uka", jeda: 0.5 },
      { s: "ibu", teks: "Buka. Wis kebuka. Ngombe.", jeda: 1.2 },
      { s: "ibu", teks: "Alon alon wae.", jeda: 0.8 },
    ],
  },
  {
    id: "N05",
    judul: "Pertanyaan beruntun",
    tujuan: "Beberapa pertanyaan rapat tanpa jeda → pertanyaan beruntun dan memotong",
    perekam: "ibu",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Ini apa?", jeda: 0.6 },
      { s: "ibu", teks: "Warnanya apa?", jeda: 0.6 },
      { s: "ibu", teks: "Bebeknya mana?", jeda: 0.7 },
      { s: "ibu", teks: "Bebeknya lagi ngapain?", jeda: 2 },
      { s: "ibu", teks: "Lagi berenang ya. Di kolam.", jeda: 1.2 },
      { s: "ibu", teks: "Raka suka bebek nggak?", jeda: 0.5 },
      { s: "ibu", teks: "Suka ya?", jeda: 0.5 },
      { s: "ibu", teks: "Mau pegang?", jeda: 1.6 },
      { s: "ibu", teks: "Nih pegang. Hati hati, licin.", jeda: 1.2 },
      { s: "ibu", teks: "Bunyinya gimana bebek?", jeda: 0.6 },
      { s: "ibu", teks: "Kwek kwek ya?", jeda: 0.6 },
      { s: "ibu", teks: "Coba Raka, kwek kwek?", jeda: 1.5 },
      { s: "ibu", teks: "Kwek kwek. Lucu ya bebeknya.", jeda: 1.2 },
      { s: "ibu", teks: "Udah, bebeknya bobok dulu.", jeda: 1.2 },
      { s: "ibu", teks: "Raka mau main apa sekarang? Bola? Mobil?", jeda: 0.6 },
      { s: "ibu", teks: "Mobil ya? Yang mana mobilnya?", jeda: 1.4 },
      { s: "ibu", teks: "Itu di bawah kursi. Ambil yuk.", jeda: 0.6 },
      { s: "ibu", teks: "Nah dapet. Mobilnya warna merah, sama kayak baju Raka.", jeda: 1 },
    ],
  },
  {
    id: "N06",
    judul: "Ayah ikut bicara",
    tujuan: "Dewasa lain menyela dan bicara panjang; perekam tetap Ibu, ucapan Ayah tidak dihitung anak",
    perekam: "ibu",
    catatan: "Orang ketiga memerankan Ayah dari agak jauh, seperti sedang lewat.",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Raka, mau main bebek?", jeda: 4.5 },
      { s: "anak", teks: "au", jeda: 0.6 },
      { s: "ibu", teks: "Mau. Mau main bebek.", jeda: 0.4, perluasan: true },
      { s: "ibu", teks: "Bebeknya di mana ya?", jeda: 1.4 },
      { s: "ayah", teks: "Bu, bebeknya kemarin aku taruh di rak atas dekat handuk, soalnya jatuh terus.", jeda: 0.8 },
      { s: "ibu", teks: "Oh iya. Makasih Yah.", jeda: 0.6 },
      { s: "ibu", teks: "Nah, ini bebeknya. Raka mau buka?", jeda: 4.6 },
      { s: "anak", teks: "uka", jeda: 0.5 },
      { s: "ibu", teks: "Buka. Buka plastiknya.", jeda: 0.6 },
      { s: "ayah", teks: "Nanti sore jadi ke rumah eyang nggak, Bu? Biar aku isi bensin dulu.", jeda: 0.7 },
      { s: "ibu", teks: "Jadi, habis Raka bobok siang.", jeda: 0.8 },
      { s: "ibu", teks: "Yuk Raka, bebeknya mandi?", jeda: 4.5 },
      { s: "ibu", teks: "Plung. Bebek mandi.", jeda: 1 },
    ],
  },
  {
    id: "N07",
    judul: "TV menyala keras",
    tujuan: "Suara TV atau musik dominan → rekaman ditolak dengan alasan bising",
    perekam: "ibu",
    harap_ditolak: "bising",
    catatan: "Putar lagu anak atau acara TV keras di dekat ponsel sepanjang rekaman.",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Raka, sini. Nonton apa sih?", jeda: 2 },
      { s: "ibu", teks: "Ih, lagunya rame ya.", jeda: 1.5 },
      { s: "ibu", teks: "Bebeknya mana?", jeda: 3 },
      { s: "ibu", teks: "Ini bebek. Mau pegang?", jeda: 3 },
      { s: "ibu", teks: "Raka lihat ibu dulu, sini.", jeda: 3 },
      { s: "ibu", teks: "Mau mamam nggak?", jeda: 3 },
      { s: "ibu", teks: "Nanti ya habis lagunya.", jeda: 3 },
      { s: "ibu", teks: "Bebek, bebek, kwek kwek.", jeda: 3 },
      { s: "ibu", teks: "Udah ah, TV-nya kekencengan.", jeda: 3 },
      { s: "ibu", teks: "Mau lagi lagunya?", jeda: 3 },
      { s: "ibu", teks: "Satu lagi ya, terus mandi.", jeda: 2 },
    ],
  },
  {
    id: "N08",
    judul: "Rekaman terlalu pendek",
    tujuan: "Berhenti di ±25 detik → ditolak karena durasi",
    perekam: "ibu",
    harap_ditolak: "durasi",
    catatan: "Tekan berhenti segera setelah baris terakhir, jangan tunggu cincin penuh.",
    ekor: 0.5,
    baris: [
      { s: "ibu", teks: "Raka, mau mamam?", jeda: 4.5 },
      { s: "anak", teks: "mam", jeda: 0.5 },
      { s: "ibu", teks: "Mamam. Ibu ambilin ya.", jeda: 1.2 },
      { s: "ibu", teks: "Pakai sendok yang ini?", jeda: 4.6 },
      { s: "ibu", teks: "Iya yang ini aja. Buka mulutnya.", jeda: 1.2 },
      { s: "ibu", teks: "Pinter. Kunyah ya.", jeda: 1 },
    ],
  },
  {
    id: "N09",
    judul: "Banyak giliran",
    tujuan: "Ajak → anak bersuara → ibu menanggapi berulang kali (≥ 4 giliran)",
    perekam: "ibu",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Mobilnya siap? Siap siap?", jeda: 4.2 },
      { s: "anak", teks: "ap", jeda: 0.5 },
      { s: "ibu", teks: "Siap! Jalan!", jeda: 1.5 },
      { s: "ibu", teks: "Mobilnya mau lagi?", jeda: 4.4 },
      { s: "anak", teks: "agi", jeda: 0.6 },
      { s: "ibu", teks: "Lagi. Ngeeng.", jeda: 1.3 },
      { s: "ibu", teks: "Sekarang yang merah atau yang biru?", jeda: 4.5 },
      { s: "anak", teks: "eh", jeda: 0.6 },
      { s: "ibu", teks: "Yang merah ya. Merah jalan.", jeda: 1.3 },
      { s: "ibu", teks: "Kok berhenti? Mau dorong?", jeda: 4.3 },
      { s: "anak", teks: "au", jeda: 0.5 },
      { s: "ibu", teks: "Mau dorong. Dorong yang kuat.", jeda: 1.4 },
      { s: "ibu", teks: "Wah nabrak bantal. Gimana dong?", jeda: 4.4 },
      { s: "anak", teks: "uh", jeda: 0.6 },
      { s: "ibu", teks: "Aduh. Mobilnya jatuh.", jeda: 1 },
    ],
  },
  {
    id: "N10",
    judul: "Ajakan tanpa tanda tanya",
    tujuan: "Kalimat menggantung dan kata target yang diikuti hening tetap dikenali sebagai ajakan",
    perekam: "ibu",
    catatan: "Baris yang berakhir \"...\" diucapkan menggantung, seperti menunggu anak melanjutkan.",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Bebeknya mau...", jeda: 4.6 },
      { s: "anak", teks: "andi", jeda: 0.6 },
      { s: "ibu", teks: "Mandi. Bebeknya mandi.", jeda: 0.5, perluasan: true },
      { s: "ibu", teks: "Sekarang kita buka...", jeda: 4.4 },
      { s: "ibu", teks: "Buka kerannya. Cuuur.", jeda: 1.4 },
      { s: "ibu", teks: "Airnya penuh. Bebek masuk...", jeda: 4.5 },
      { s: "anak", teks: "uk", jeda: 0.5 },
      { s: "ibu", teks: "Masuk. Plung.", jeda: 1.6 },
      { s: "ibu", teks: "Satu, dua...", jeda: 4.3 },
      { s: "ibu", teks: "Tiga! Byur.", jeda: 1.2 },
      { s: "ibu", teks: "Raka basah. Bebek juga basah.", jeda: 1.3 },
      { s: "ibu", teks: "Sekarang sabunnya. Sabun, gosok...", jeda: 4.4 },
      { s: "anak", teks: "osok", jeda: 0.5 },
      { s: "ibu", teks: "Gosok. Gosok perutnya.", jeda: 1.2 },
      { s: "ibu", teks: "Udah wangi. Sebentar lagi selesai ya, tinggal bilas.", jeda: 0.8 },
    ],
  },
  {
    id: "N11",
    judul: "Anak menjawab cepat",
    tujuan: "Anak bersuara kurang dari 1 detik setelah ajakan → tetap anak merespons, jeda pendek tidak dihitung memotong",
    perekam: "ibu",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Raka mau bebek?", jeda: 0.7 },
      { s: "anak", teks: "au", jeda: 0.5 },
      { s: "ibu", teks: "Mau. Nih bebeknya.", jeda: 1.4 },
      { s: "ibu", teks: "Bebeknya bunyinya?", jeda: 0.8 },
      { s: "anak", teks: "wek", jeda: 0.5 },
      { s: "ibu", teks: "Kwek kwek! Pinter.", jeda: 1.5 },
      { s: "ibu", teks: "Lagi?", jeda: 0.6 },
      { s: "anak", teks: "agi", jeda: 0.6 },
      { s: "ibu", teks: "Kwek kwek lagi.", jeda: 1.5 },
      { s: "ibu", teks: "Bebeknya bobok ya. Ssst.", jeda: 1.5 },
      { s: "ibu", teks: "Udah bobok? Mau bangunin?", jeda: 0.9 },
      { s: "anak", teks: "au", jeda: 0.5 },
      { s: "ibu", teks: "Bangun, bebek! Pagi pagi.", jeda: 1.5 },
      { s: "ibu", teks: "Yuk kita taruh di kotak.", jeda: 1.2 },
      { s: "ibu", teks: "Kotaknya buka?", jeda: 0.7 },
      { s: "anak", teks: "uka", jeda: 0.5 },
      { s: "ibu", teks: "Buka. Masukin bebeknya.", jeda: 1.4 },
      { s: "ibu", teks: "Tutup lagi? Klik.", jeda: 1.3 },
      { s: "ibu", teks: "Nah, udah rapi. Sekarang cuci tangan dulu, terus mamam siang ya.", jeda: 1 },
    ],
  },
  {
    id: "N12",
    judul: "Banyak perluasan",
    tujuan: "Ibu mengulang dan menambah satu kata setiap kali anak bersuara (3 perluasan)",
    perekam: "ibu",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Raka, ini apa?", jeda: 4.4 },
      { s: "anak", teks: "bek", jeda: 0.5 },
      { s: "ibu", teks: "Bebek. Bebek kuning.", jeda: 0.4, perluasan: true },
      { s: "ibu", teks: "Bebeknya mau ke mana?", jeda: 4.5 },
      { s: "anak", teks: "andi", jeda: 0.5 },
      { s: "ibu", teks: "Mandi. Mandi di ember.", jeda: 0.4, perluasan: true },
      { s: "ibu", teks: "Embernya penuh nggak?", jeda: 4.4 },
      { s: "anak", teks: "uh", jeda: 0.5 },
      { s: "ibu", teks: "Penuh ya. Ember penuh air.", jeda: 1.2 },
      { s: "ibu", teks: "Terus bebeknya?", jeda: 4.6 },
      { s: "anak", teks: "agi", jeda: 0.5 },
      { s: "ibu", teks: "Lagi. Bebek mandi lagi.", jeda: 0.4, perluasan: true },
      { s: "ibu", teks: "Udah ah, nanti kedinginan.", jeda: 1.2 },
      { s: "ibu", teks: "Handuknya mana ya? Tadi ibu taruh di kursi.", jeda: 0.6 },
      { s: "ibu", teks: "Ini dia. Sini, ibu keringin rambutnya dulu.", jeda: 1 },
    ],
  },
  {
    id: "N13",
    judul: "Mbak Sri saat makan",
    tujuan: "Perekam pengasuh, rutinitas makan; dicatat atas nama Mbak Sri",
    perekam: "sri",
    catatan: "Masuk lewat mode demo sebagai Mbak Sri sebelum merekam.",
    ekor: 1,
    baris: [
      { s: "sri", teks: "Dek Raka, maem yuk. Mbak suapin ya.", jeda: 0.6 },
      { s: "sri", teks: "Mau mamam?", jeda: 4.5 },
      { s: "anak", teks: "mam", jeda: 0.5 },
      { s: "sri", teks: "Mamam. Mamam nasi.", jeda: 0.4, perluasan: true },
      { s: "sri", teks: "Ayamnya juga ya, dikit.", jeda: 1.3 },
      { s: "sri", teks: "Enak nggak?", jeda: 1.5 },
      { s: "sri", teks: "Enak ya. Ayo satu lagi.", jeda: 1.2 },
      { s: "sri", teks: "Mau lagi?", jeda: 4.4 },
      { s: "anak", teks: "agi", jeda: 0.5 },
      { s: "sri", teks: "Lagi. Nih, aaa.", jeda: 1.4 },
      { s: "sri", teks: "Pinter. Minum dulu ya.", jeda: 1.2 },
      { s: "sri", teks: "Gelasnya buka dulu?", jeda: 4.3 },
      { s: "sri", teks: "Mbak bukain ya. Pelan pelan minumnya.", jeda: 1.3 },
      { s: "sri", teks: "Udah kenyang? Perutnya mana, coba Mbak lihat.", jeda: 1.5 },
      { s: "sri", teks: "Wah, bunder. Kenyang beneran ini. Yuk cuci tangan dulu, terus bobok siang.", jeda: 0.8 },
    ],
  },
  {
    id: "N14",
    judul: "Suara anak bukan kata",
    tujuan: "Ocehan dan tawa anak tetap dihitung vokalisasi meski bukan kata",
    perekam: "ibu",
    catatan: "Pemeran anak bersuara \"aaa\", \"eh\", tertawa kecil, bukan kata.",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Cilukba! Mana ibu?", jeda: 4.4 },
      { s: "anak", teks: "aaa", jeda: 0.5 },
      { s: "ibu", teks: "Ba! Ini ibu.", jeda: 1.4 },
      { s: "ibu", teks: "Lagi? Ibu ngumpet lagi ya.", jeda: 4.5 },
      { s: "anak", teks: "eh eh", jeda: 0.6 },
      { s: "ibu", teks: "Ba! Hehe, kaget ya.", jeda: 1.4 },
      { s: "ibu", teks: "Sekarang Raka yang ngumpet?", jeda: 4.6 },
      { s: "anak", teks: "hihi", jeda: 0.5 },
      { s: "ibu", teks: "Raka mana ya? Kok nggak ada.", jeda: 1.3 },
      { s: "ibu", teks: "Ketemu! Di balik bantal.", jeda: 1.5 },
      { s: "ibu", teks: "Udah capek? Minum dulu.", jeda: 1.3 },
      { s: "ibu", teks: "Sekali lagi ya, terakhir. Mana Raka?", jeda: 4.5 },
      { s: "anak", teks: "aaa", jeda: 0.5 },
      { s: "ibu", teks: "Ba! Ketemu lagi.", jeda: 1.2 },
      { s: "ibu", teks: "Udah ya mainnya, sekarang kita beresin bantalnya dulu.", jeda: 1 },
    ],
  },
  {
    id: "N15",
    judul: "Campuran realistis",
    tujuan: "Gabungan: memotong, menunggu cukup, anak merespons, satu suruhan, perluasan",
    perekam: "ibu",
    ekor: 1,
    baris: [
      { s: "ibu", teks: "Raka, pakai baju dulu yuk. Mau yang mana?", jeda: 1.3 },
      { s: "ibu", teks: "Yang biru ya, ada gambar bebeknya.", jeda: 0.6 },
      { s: "ibu", teks: "Tangannya masuk. Mana tangannya?", jeda: 4.6 },
      { s: "anak", teks: "ni", jeda: 0.5 },
      { s: "ibu", teks: "Ini. Ini tangan Raka.", jeda: 0.5, perluasan: true },
      { s: "ibu", teks: "Kancingnya, ayo bilang buka.", jeda: 1 },
      { s: "ibu", teks: "Nggak usah deh. Ibu bantu.", jeda: 1.5 },
      { s: "ibu", teks: "Celananya, kaki dulu. Kaki mana?", jeda: 4.4 },
      { s: "ibu", teks: "Nah ini. Masukin.", jeda: 1.3 },
      { s: "ibu", teks: "Udah ganteng. Mau sisiran?", jeda: 4.5 },
      { s: "anak", teks: "au", jeda: 0.5 },
      { s: "ibu", teks: "Mau. Sisir dulu rambutnya.", jeda: 1.4 },
      { s: "ibu", teks: "Udah. Yuk keluar, Mbak Sri nunggu.", jeda: 1 },
    ],
  },
];

// ---------------------------------------------------------------- Kunci

export type AjakanKunci = { baris: number; teks: string; t_selesai: number; kategori: "anak_merespons" | "menunggu_cukup" | "memotong"; jeda_s: number };
export type Kunci = {
  id: string;
  durasi_s: number;
  harap_ditolak: "durasi" | "bising" | null;
  ajakan: AjakanKunci[];
  perluasan: number;
  giliran: number;
  vokalisasi_anak: number;
  suruhan_beruntun: number;
  /** Diisi manual dari Audacity, urutan sama dengan `ajakan`. null = belum diukur. */
  jeda_manual_s: (number | null)[];
};

const durasiBaris = (b: Baris) => (b.s === "anak" ? DURASI_ANAK : Math.max(0.5, b.teks.split(/\s+/).length * DETIK_PER_KATA));

/** Waktu mulai dan selesai setiap baris bila naskah dibaca dengan jeda yang tertulis, mulai detik 1. */
export function lini(n: Naskah) {
  let t = 1;
  return n.baris.map((b) => {
    const mulai = t;
    const selesai = mulai + durasiBaris(b);
    t = selesai + b.jeda;
    return { ...b, mulai, selesai };
  });
}

/**
 * Ucapan menurut definisi proposal 4.1: bicara bersambung satu orang. Baris yang memuat beberapa pertanyaan
 * dipecah di setiap tanda tanya (pertanyaan yang langsung disusul kalimat lain berjeda ±0,15 detik), lalu
 * potongan berurutan dari orang yang sama digabung bila jedanya ≤ 0,8 detik dan potongan sebelumnya bukan pertanyaan.
 */
export function ucapanKunci(n: Naskah) {
  const potong: { s: Penutur; teks: string; mulai: number; selesai: number; baris: number }[] = [];
  lini(n).forEach((b, i) => {
    const kalimat = b.s === "anak" ? [b.teks] : (b.teks.match(/[^?]+\?|[^?]+$/g) ?? [b.teks]).map((x) => x.trim()).filter(Boolean);
    const total = kalimat.reduce((a, k) => a + k.split(/\s+/).length, 0);
    let t = b.mulai;
    kalimat.forEach((k, j) => {
      const porsi = ((b.selesai - b.mulai) * k.split(/\s+/).length) / total;
      const celah = j < kalimat.length - 1 ? 0.15 : 0;
      potong.push({ s: b.s, teks: k, mulai: t, selesai: t + porsi - celah, baris: i + 1 });
      t += porsi;
    });
  });
  const hasil: typeof potong = [];
  for (const p of potong) {
    const akhir = hasil.at(-1);
    if (akhir && akhir.s === p.s && p.mulai - akhir.selesai <= 0.8 && !akhir.teks.endsWith("?")) {
      akhir.teks = `${akhir.teks} ${p.teks}`;
      akhir.selesai = p.selesai;
    } else hasil.push({ ...p });
  }
  return hasil;
}

const memuatTarget = (teks: string) => KATA_TARGET.some((k) => teks.toLowerCase().match(new RegExp(`\\b${k}\\b`)));
const kataSuruh = (teks: string) => (teks.toLowerCase().match(/\bayo bilang\b|\bbilang dong\b/g) ?? []).length;

export function hitungKunci(n: Naskah): Kunci {
  const l = ucapanKunci(n);
  const perekam = n.perekam;
  const ajakan: AjakanKunci[] = [];
  let giliran = 0;
  l.forEach((b, i) => {
    if (b.s !== perekam) return;
    const berikut = l[i + 1];
    const hening = berikut ? berikut.mulai - b.selesai : n.ekor;
    if (!(b.teks.trim().endsWith("?") || memuatTarget(b.teks) || hening >= 1)) return;
    if (!berikut) {
      if (hening >= AMBANG) ajakan.push({ baris: b.baris, teks: b.teks, t_selesai: b.selesai, kategori: "menunggu_cukup", jeda_s: hening });
      return;
    }
    if (berikut.s === "anak") {
      ajakan.push({ baris: b.baris, teks: b.teks, t_selesai: b.selesai, kategori: "anak_merespons", jeda_s: hening });
      const tanggap = l[i + 2];
      if (tanggap && tanggap.s === perekam && tanggap.mulai - berikut.selesai <= 5) giliran++;
    } else if (hening >= AMBANG) {
      ajakan.push({ baris: b.baris, teks: b.teks, t_selesai: b.selesai, kategori: "menunggu_cukup", jeda_s: hening });
    } else if (berikut.s === perekam) {
      ajakan.push({ baris: b.baris, teks: b.teks, t_selesai: b.selesai, kategori: "memotong", jeda_s: hening });
    } // disela dewasa lain sebelum ambang: tidak dinilai
  });

  // Suruhan beruntun: ≥ 2 "ayo bilang" berjarak ≤ ambang tanpa suara anak di antaranya.
  let runtun = 0;
  let panjang = 0;
  let akhirSebelum = -Infinity;
  for (const b of l) {
    if (b.s === "anak") {
      if (panjang >= 2) runtun++;
      panjang = 0;
      continue;
    }
    const k = b.s === perekam ? kataSuruh(b.teks) : 0;
    if (k === 0) continue;
    if (b.mulai - akhirSebelum <= AMBANG) panjang += k;
    else {
      if (panjang >= 2) runtun++;
      panjang = k;
    }
    akhirSebelum = b.selesai;
  }
  if (panjang >= 2) runtun++;

  const akhir = l.at(-1)!;
  const bulat = (x: number) => Math.round(x * 10) / 10;
  return {
    id: n.id,
    durasi_s: bulat(akhir.selesai + n.ekor),
    harap_ditolak: n.harap_ditolak ?? null,
    ajakan: ajakan.map((a) => ({ ...a, t_selesai: bulat(a.t_selesai), jeda_s: bulat(a.jeda_s) })),
    perluasan: n.baris.filter((b) => b.perluasan).length,
    giliran,
    vokalisasi_anak: l.filter((b) => b.s === "anak").length,
    suruhan_beruntun: runtun,
    jeda_manual_s: ajakan.map(() => null),
  };
}

// ---------------------------------------------------------------- Naskah siap baca

const NAMA: Record<Penutur, string> = { ibu: "Ibu", anak: "Raka", ayah: "Ayah", sri: "Mbak Sri" };

function aba(jeda: number) {
  if (jeda >= AMBANG) return `*(diam, hitung dalam hati sampai lima)*`;
  if (jeda >= 1) return `*(jeda sebentar, kira-kira satu detik)*`;
  return "";
}

export function naskahMarkdown(): string {
  const bagian = NASKAH.map((n) => {
    const k = hitungKunci(n);
    const baris = n.baris.map((b) => `- **${NAMA[b.s]}:** ${b.teks} ${aba(b.jeda)}`.trimEnd()).join("\n");
    const harap = n.harap_ditolak ? `Harus ditolak (${n.harap_ditolak === "durasi" ? "terlalu pendek" : "TV atau musik"}).` : `Kunci: ${k.ajakan.length} ajakan, ${k.giliran} giliran, ${k.perluasan} perluasan.`;
    return [`## ${n.id} · ${n.judul}`, "", `Perekam: ${NAMA[n.perekam]} · durasi ±${Math.round(k.durasi_s)} detik · ${harap}`, n.catatan ? `\n${n.catatan}\n` : "", baris].join("\n");
  });
  return [
    "# Naskah rekaman uji akurasi",
    "",
    "Rekaman bernaskah yang diperankan tim untuk uji akurasi (proposal 4.4). Bukan suara anak sungguhan.",
    "",
    "Cara merekam:",
    "1. Buka aplikasi di HP Android, masuk lewat mode demo sebagai Ibu Sari (N13 sebagai Mbak Sri).",
    "2. Buka Rekam 1 Menit dari kartu aktivitas, taruh ponsel di meja sekitar satu meter dari pemeran.",
    "3. Rekam N01 sampai N15 berurutan. Tekan berhenti satu detik setelah baris terakhir.",
    "4. Pemeran Raka cukup bersuara pendek dan bernada tinggi. Pada aba-aba *(diam, hitung dalam hati sampai lima)* semua benar-benar diam. Baris tanpa aba-aba langsung disambung.",
    "5. Kalau ada yang salah baca, berhenti, lalu rekam ulang naskah itu dari awal sebelum lanjut ke nomor berikutnya.",
    "",
    "Setelah selesai, jalankan `uji/ambil-rekaman.ts` lalu ukur jeda manual di Audacity (lihat README bagian Hasil uji akurasi).",
    "",
    ...bagian.flatMap((b) => [b, ""]),
  ].join("\n");
}
