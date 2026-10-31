import Link from "next/link";
import { Ikon } from "./ikon";

const kelasKembali =
  "tekan inline-flex min-h-11 items-center gap-0.5 justify-self-start pr-3 text-[16px] font-medium text-hijau-tua";

// Tautan "‹ Kembali" hijau di kiri, judul kecil di tengah.
// `saatKembali` dipakai bila kembali berarti mundur satu langkah di halaman yang sama, bukan pindah rute.
export function KepalaHalaman({
  kembali = "/hari-ini",
  judul,
  saatKembali,
}: {
  kembali?: string;
  judul?: string;
  saatKembali?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-2 grid grid-cols-[1fr_auto_1fr] items-center bg-background/85 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      {saatKembali ? (
        <button type="button" onClick={saatKembali} className={kelasKembali}>
          <Ikon nama="kembali" ukuran={22} />
          Kembali
        </button>
      ) : (
        <Link href={kembali} className={kelasKembali}>
          <Ikon nama="kembali" ukuran={22} />
          Kembali
        </Link>
      )}
      {judul ? <span className="truncate text-[15px] font-semibold">{judul}</span> : <span />}
      <span />
    </header>
  );
}
