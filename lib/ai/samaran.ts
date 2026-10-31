// Penyamaran nama sebelum transkrip dikirim ke model bahasa (proposal 4.3), dan pengembaliannya sesudahnya.
// Anak → "adik", anggota → peran ("ibu", "pengasuh"), klinik → "klinik", terapis → "terapis".

export type PetaSamaran = { asli: string; samaran: string }[];

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buatPeta(nama: { anak: string; anggota: { nama: string; peran: string }[]; klinik?: string; terapis?: string }): PetaSamaran {
  const peta: PetaSamaran = [{ asli: nama.anak, samaran: "adik" }];
  for (const a of nama.anggota) peta.push({ asli: a.nama, samaran: a.peran === "lainnya" ? "keluarga" : a.peran });
  if (nama.klinik) peta.push({ asli: nama.klinik, samaran: "klinik" });
  if (nama.terapis) peta.push({ asli: nama.terapis, samaran: "terapis" });
  // Nama panjang dulu, supaya "Ibu Sari" diganti sebelum "Sari".
  return peta.filter((p) => p.asli.trim().length >= 2).sort((a, b) => b.asli.length - a.asli.length);
}

export function samarkan(teks: string, peta: PetaSamaran): string {
  let hasil = teks;
  for (const { asli, samaran } of peta) {
    hasil = hasil.replace(new RegExp(`\\b${escapeRe(asli)}\\b`, "gi"), samaran);
    // Nama depan saja (misal "Sari" dari "Ibu Sari") ikut disamarkan.
    const depan = asli.split(/\s+/).at(-1)!;
    if (depan !== asli && depan.length >= 3) hasil = hasil.replace(new RegExp(`\\b${escapeRe(depan)}\\b`, "gi"), samaran);
  }
  return hasil;
}

/** Kembalikan nama anak di teks keluaran AI ("adik" → "Raka"). Samaran lain dibiarkan. */
export function kembalikanAnak(teks: string, namaAnak: string): string {
  return teks.replace(/\b[Aa]dik\b/g, namaAnak);
}
