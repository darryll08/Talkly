// Lingkaran inisial untuk orang.
export function inisialDari(nama: string) {
  const bersih = nama.replace(/^(Kak|Ibu|Bu|Mbak|Bapak|Pak|Mas)\s+/i, "").trim();
  const kata = bersih.split(/\s+/).filter(Boolean);
  if (kata.length === 0) return "?";
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
  return (kata[0][0] + kata[1][0]).toUpperCase();
}

const warna = {
  hijau: "bg-hijau text-white",
  oranye: "bg-oranye-muda text-oranye-tua",
  abu: "bg-abu-muda text-abu",
};

export function Inisial({
  nama,
  ukuran = 40,
  nada = "hijau",
}: {
  nama: string;
  ukuran?: number;
  nada?: keyof typeof warna;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ width: ukuran, height: ukuran, fontSize: Math.round(ukuran * 0.38) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${warna[nada]}`}
    >
      {inisialDari(nama)}
    </span>
  );
}
