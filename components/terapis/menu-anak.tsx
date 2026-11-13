"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Kartu anak", akhiran: "" },
  { label: "Program", akhiran: "/program" },
  { label: "Undang keluarga", akhiran: "/undangan" },
  { label: "Setelah sesi", akhiran: "/setelah-sesi" },
  { label: "Pesan keluarga", akhiran: "/pesan" },
] as const;

// Tab halaman anak berbentuk pil; yang aktif hijau tua. Di layar sempit tab bisa digeser ke samping.
// Parent layout membungkus hook URL ini dalam Suspense sesuai AGENTS.md.
export function MenuAnak({ anakId }: { anakId: string }) {
  const pathname = usePathname();
  const dasar = `/terapis/anak/${encodeURIComponent(anakId)}`;

  return (
    <nav
      aria-label="Halaman anak"
      // Menempel tepat di bawah TopbarPanel (h-16) di layar sempit, di tepi atas di layar lebar. Latar pita penuh
      // selebar area isi, supaya isi halaman tidak terlihat lewat celah saat digulir.
      className="sticky top-16 z-20 -mx-4 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur-xl [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10"
    >
      <ul className="flex w-max gap-1 rounded-full bg-permukaan p-1.5 shadow-kartu ring-1 ring-garis sm:w-auto">
        {menu.map(({ label, akhiran }) => {
          const href = `${dasar}${akhiran}`;
          const aktif = pathname === href || pathname === `${href}/`;
          return (
            <li key={label} className="sm:flex-1">
              <Link
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={`tekan flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 text-center text-sm font-semibold ${
                  aktif ? "bg-hijau-tua text-white shadow-angkat" : "text-abu hover:bg-background hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
