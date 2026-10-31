"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ikon, type NamaIkon } from "./ikon";

const SEMBUNYI = ["/rekam", "/hasil", "/gabung", "/masuk", "/mulai", "/cek-perangkat"];

type Menu = { href: string; label: string; ikon: NamaIkon; hanyaPengelola?: boolean };

const MENU: Menu[] = [
  { href: "/hari-ini", label: "Hari ini", ikon: "rumah" },
  { href: "/kemajuan", label: "Kemajuan", ikon: "grafik" },
  { href: "/keluarga", label: "Keluarga", ikon: "keluarga", hanyaPengelola: true },
  { href: "/profil", label: "Profil", ikon: "orang" },
];

/** Navigasi bawah tembus pandang. Dibungkus <Suspense> oleh layout karena memakai usePathname. */
export function NavOrtu({ pengelola }: { pengelola: boolean }) {
  const path = usePathname();
  if (SEMBUNYI.some((p) => path === p || path.startsWith(p + "/"))) return null;
  const menu = MENU.filter((m) => !m.hanyaPengelola || pengelola);

  return (
    <nav
      aria-label="Menu utama"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-garis bg-permukaan/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl motion-safe:transition-colors [@media(prefers-reduced-transparency:reduce)]:bg-permukaan"
    >
      <ul className="mx-auto flex max-w-md">
        {menu.map((m) => {
          const aktif = path === m.href || path.startsWith(m.href + "/");
          return (
            <li key={m.href} className="flex-1">
              <Link
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={`tekan flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  aktif ? "text-hijau-tua" : "text-abu"
                }`}
              >
                <Ikon nama={m.ikon} isi={aktif} ukuran={24} />
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tinggi ruang yang perlu disisakan di bawah isi halaman agar tidak tertutup nav. */
export const RUANG_NAV = "pb-[calc(76px+env(safe-area-inset-bottom))]";
