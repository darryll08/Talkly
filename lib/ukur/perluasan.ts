import type { Rentang, Ucapan } from "./tipe";

// Perluasan (proposal 4.1): perekam menanggapi suara anak dengan mengulang kata anak, lalu memakai kata itu
// lagi dalam frasa yang lebih panjang. Contoh: ANAK "bek" → "Bebek. Bebek kuning." atau "Iya bebek, bebek mandi."
// Tidak dihitung: hanya mengulang ("Lagi."), atau kalimat sesudahnya tidak memuat kata anak ("Mau. Nih bebeknya.").
// Dihitung kode, bukan AI, supaya konsisten dan bisa diuji.

const TANGGAP_MAKS_S = 5;

const kataDari = (teks: string): string[] => teks.toLowerCase().match(/[\p{L}]+/gu) ?? [];

/** Kata perekam cocok dengan suara anak bila sama atau anak mengucapkan ujungnya ("bek" → bebek, "uka" → buka). */
function cocok(kataPerekam: string, suaraAnak: string) {
  return suaraAnak.length >= 2 && (kataPerekam === suaraAnak || kataPerekam.endsWith(suaraAnak));
}

/** Satu tanggapan: kata anak diulang di dua potongan pertama, lalu muncul lagi di potongan ≥ 2 kata sesudahnya. */
export function adalahPerluasan(suaraAnak: string, tanggapan: string) {
  const anak = kataDari(suaraAnak);
  if (anak.length === 0) return false;
  const potong = tanggapan
    .split(/[.,!?;]+/)
    .map(kataDari)
    .filter((p) => p.length > 0);
  for (const a of anak) {
    const ulang = potong.findIndex((p, i) => i < 2 && p.some((w) => cocok(w, a)));
    if (ulang < 0) continue;
    const kata = potong[ulang].find((w) => cocok(w, a))!;
    if (potong.slice(ulang + 1).some((p) => p.length >= 2 && p.includes(kata))) return true;
  }
  return false;
}

/** Jumlah perluasan dalam rekaman. Suara anak tanpa teks (celah hening) tidak bisa dinilai. */
export function hitungPerluasan(ucapan: Ucapan[], perekam: string | null, suaraAnak: Rentang[]) {
  const urut = [...ucapan].sort((a, b) => a.t_mulai - b.t_mulai);
  let n = 0;
  urut.forEach((u, i) => {
    const anak = suaraAnak.some((s) => Math.abs(s.t_mulai - u.t_mulai) < 0.05 && Math.abs(s.t_selesai - u.t_selesai) < 0.05);
    if (!anak) return;
    const berikut = urut[i + 1];
    if (berikut && berikut.pembicara === perekam && berikut.t_mulai - u.t_selesai <= TANGGAP_MAKS_S && adalahPerluasan(u.teks, berikut.teks)) n++;
  });
  return n;
}
