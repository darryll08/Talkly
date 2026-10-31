"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavOrtu, RUANG_NAV } from "./nav-ortu";
import { useSaya } from "@/lib/perangkat/saya";
import { pasangPengirimOtomatis } from "@/lib/perangkat/antrean";

const TANPA_NAV = ["/rekam", "/hasil", "/gabung", "/masuk", "/mulai", "/cek-perangkat"];

export function BingkaiOrtu({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const tanpaNav = TANPA_NAV.some((p) => path === p || path.startsWith(p + "/"));
  const { data } = useSaya();

  // Rekaman yang mengantre dikirim saat aplikasi dibuka dan saat sinyal kembali.
  useEffect(() => pasangPengirimOtomatis(), []);

  return (
    <>
      <main className={`mx-auto min-h-dvh w-full max-w-md px-4 pt-[env(safe-area-inset-top)] ${tanpaNav ? "pb-8" : RUANG_NAV}`}>
        {children}
      </main>
      <NavOrtu pengelola={data?.anggota.pengelola ?? false} />
    </>
  );
}
