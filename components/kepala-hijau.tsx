import Link from "next/link";
import type { ReactNode } from "react";
import { Ikon } from "./ikon";

// Kepala halaman hijau tua (gaya opsi C): judul besar di atas warna merek, kartu pertama di bawahnya menumpuk
// ke atas memakai kelas `tumpuk` dari lib/gaya. "layar" = selebar layar ponsel (layar orang tua),
// "panel" = blok bersudut bulat di dalam kolom (dasbor terapis dan admin).
export function KepalaHijau({
  atas,
  judul,
  kembali,
  saatKembali,
  kanan,
  children,
  bentuk = "layar",
  rapat = false,
}: {
  atas?: ReactNode;
  judul: ReactNode;
  kembali?: string;
  saatKembali?: () => void;
  kanan?: ReactNode;
  children?: ReactNode;
  bentuk?: "layar" | "panel";
  /** Tanpa ruang bawah untuk kartu yang menumpuk. */
  rapat?: boolean;
}) {
  const kelasKembali =
    "tekan -ml-1 mb-2 inline-flex min-h-11 items-center gap-0.5 pr-3 text-[15px] font-semibold text-teks-di-hijau";
  const bentukKelas =
    bentuk === "layar"
      ? `-mx-4 rounded-b-[32px] px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] ${rapat ? "pb-6" : "pb-14"}`
      : `rounded-[28px] px-6 pt-6 sm:px-8 ${rapat ? "pb-6" : "pb-14"}`;

  return (
    <header className={`kepala-hijau relative isolate overflow-hidden bg-hijau-tua text-white ${bentukKelas}`}>
      <div className="relative z-10">
        {saatKembali ? (
          <button type="button" onClick={saatKembali} className={kelasKembali}>
            <Ikon nama="kembali" ukuran={20} /> Kembali
          </button>
        ) : kembali ? (
          <Link href={kembali} className={kelasKembali}>
            <Ikon nama="kembali" ukuran={20} /> Kembali
          </Link>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            {atas ? <p className="text-[14px] font-medium text-teks-di-hijau">{atas}</p> : null}
            <h1 className="text-[30px] font-extrabold leading-[1.1]">{judul}</h1>
          </div>
          {kanan}
        </div>
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </header>
  );
}
