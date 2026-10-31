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

// Parent layout membungkus hook URL ini dalam Suspense sesuai AGENTS.md.
export function MenuAnak({ anakId }: { anakId: string }) {
  const pathname = usePathname();
  const dasar = `/terapis/anak/${encodeURIComponent(anakId)}`;

  return (
    <nav
      aria-label="Halaman anak"
      className="sticky top-0 z-20 rounded-2xl border border-garis bg-permukaan/80 p-1.5 backdrop-blur-xl"
    >
      <ul className="flex flex-wrap gap-1">
        {menu.map(({ label, akhiran }) => {
          const href = `${dasar}${akhiran}`;
          const aktif = pathname === href || pathname === `${href}/`;
          return (
            <li key={label} className="min-w-0 flex-1 basis-28">
              <Link
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={`tekan flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-semibold ${
                  aktif
                    ? "bg-hijau-muda text-hijau-tua"
                    : "text-abu hover:bg-background hover:text-foreground"
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
