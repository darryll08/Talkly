// Ikon garis 24 px. `isi` mengisi bentuknya (dipakai untuk tab aktif di NavOrtu).

type Nama =
  | "rumah"
  | "grafik"
  | "keluarga"
  | "orang"
  | "mikrofon"
  | "bulan"
  | "pena"
  | "kamera"
  | "pesan"
  | "bintang"
  | "panah-kanan"
  | "kembali"
  | "centang"
  | "putar"
  | "jeda"
  | "kirim"
  | "info"
  | "lonceng"
  | "silang"
  | "salin"
  | "bagikan"
  | "tambah";

const jalur: Record<Nama, React.ReactNode> = {
  rumah: <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6h-6v6H4.5a1 1 0 0 1-1-1z" />,
  grafik: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M21 20H3" />
    </>
  ),
  keluarga: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5z" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14c2.4 0 4.1 1.5 4.5 4.5H17.8" />
    </>
  ),
  orang: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.7-4.2 3.8-6.5 8-6.5s7.3 2.3 8 6.5z" />
    </>
  ),
  mikrofon: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" fill="none" />
      <path d="M12 17.5V21" />
    </>
  ),
  bulan: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  pena: (
    <>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  kamera: (
    <>
      <path d="M4 7.5h3l1.5-2.5h7L17 7.5h3a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  pesan: <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4.5 3.5V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z" />,
  bintang: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  "panah-kanan": (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  kembali: <path d="m15 5-7 7 7 7" />,
  centang: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  putar: <path d="M8 5.5v13l10.5-6.5z" />,
  jeda: (
    <>
      <path d="M8.5 5v14" />
      <path d="M15.5 5v14" />
    </>
  ),
  kirim: (
    <>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.5v.5" />
    </>
  ),
  lonceng: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z" />
      <path d="M10 21h4" />
    </>
  ),
  silang: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  salin: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
    </>
  ),
  bagikan: (
    <>
      <path d="M12 15V3.5" />
      <path d="m7.5 8 4.5-4.5L16.5 8" />
      <path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12" />
    </>
  ),
  tambah: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
};

export function Ikon({
  nama,
  isi = false,
  ukuran = 24,
  className,
}: {
  nama: Nama;
  isi?: boolean;
  ukuran?: number;
  className?: string;
}) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill={isi ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {jalur[nama]}
    </svg>
  );
}

export type NamaIkon = Nama;
