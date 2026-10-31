// Token kelas Tailwind bersama (K14). Layar O dan D memakai ini, tidak menulis ulang kelasnya.

export const tombolUtama =
  "tekan inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-hijau px-5 py-4 text-base font-semibold text-white shadow-angkat disabled:bg-abu/40 disabled:shadow-none";

export const tombolKedua =
  "tekan inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-permukaan px-5 py-4 text-base font-semibold text-hijau-tua ring-1 ring-hijau/30 disabled:text-abu disabled:ring-garis";

export const tombolTeks =
  "tekan inline-flex min-h-11 items-center gap-1 px-1 text-[15px] font-semibold text-hijau-tua disabled:text-abu";

export const isian =
  "w-full rounded-xl border border-garis bg-permukaan px-4 py-3 text-base text-foreground placeholder:text-abu outline-none transition-shadow focus:border-hijau focus:ring-4 focus:ring-hijau/15";

export const kartu = "rounded-2xl bg-permukaan p-4 shadow-kartu";

/** Kartu pertama yang menumpuk ke atas kepala hijau (KepalaHijau). */
export const tumpuk = "relative z-10 -mt-9 rounded-3xl bg-permukaan p-5 shadow-tumpuk";

/** Tombol rekam bulat oranye dengan cincin: aksi utama merekam di Hari ini dan kartu aktivitas. */
export const tombolRekam =
  "tekan inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-oranye text-white shadow-angkat ring-[6px] ring-oranye-muda";

/** Daftar bergaya Pengaturan iPhone: satu kartu dengan pemisah tipis. */
export const daftar = "divide-y divide-garis overflow-hidden rounded-2xl bg-permukaan shadow-kartu";
export const barisDaftar = "flex min-h-14 items-center gap-3 px-4 py-3";

export const judulHalaman = "font-judul text-[30px] font-extrabold";
export const labelAtas = "text-[13px] font-medium text-abu";
export const labelSeksi = "px-1 text-xs font-semibold uppercase tracking-[0.08em] text-abu";

/** Label kata target berbentuk bulat. */
export const labelKata = "inline-flex items-center rounded-full bg-permukaan px-3 py-1 text-sm font-semibold text-foreground ring-1 ring-garis";

/** Galat: teks dari server, berwarna oranye (tidak ada merah). */
export const kotakGalat = "rounded-2xl bg-oranye-muda px-4 py-3 text-[15px] text-oranye-tua";

export const angkaBesar = "font-judul font-extrabold tabular-nums";

/** Satu kolom aplikasi orang tua. */
export const kolomOrtu = "mx-auto w-full max-w-md px-4";
