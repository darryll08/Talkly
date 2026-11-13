"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Merek } from "@/components/merek";
import { Ikon, type NamaIkon } from "@/components/ikon";
import { keluarSekarang } from "@/lib/perangkat/sesi-contoh";

const MENU: { href: string; label: string; ikon: NamaIkon; persis?: boolean }[] = [
  { href: "/terapis", label: "Minggu ini", ikon: "kalender", persis: true },
  { href: "/terapis/anak/baru", label: "Tambah anak", ikon: "tambah", persis: true },
];

// Sidebar dasbor terapis untuk layar lebar (≥ lg). Di layar sempit, TopbarPanel yang dipakai.
// Dibungkus Suspense oleh layout karena memakai usePathname.
export function SisiTerapis() {
  const path = usePathname();
  const diAnak = path.startsWith("/terapis/anak/") && path !== "/terapis/anak/baru";

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r border-garis bg-permukaan px-5 py-6 lg:flex">
      <div className="px-2">
        <Merek />
      </div>

      <nav aria-label="Menu dasbor" className="space-y-1">
        <p className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-abu">Menu</p>
        {MENU.map((m) => {
          const aktif = m.persis ? path === m.href || (m.href === "/terapis" && diAnak) : path.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={aktif ? "page" : undefined}
              className={`tekan relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold ${
                aktif ? "bg-hijau-muda text-hijau-tua" : "text-abu hover:bg-background hover:text-foreground"
              }`}
            >
              {aktif ? <span className="absolute -left-5 h-6 w-1 rounded-r-full bg-hijau-tua" aria-hidden="true" /> : null}
              <Ikon nama={m.ikon} ukuran={20} />
              {m.label}
            </Link>
          );
        })}
      </nav>

      <nav aria-label="Umum" className="space-y-1">
        <p className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-abu">Umum</p>
        <Link
          href="/cek-perangkat"
          className="tekan flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold text-abu hover:bg-background hover:text-foreground"
        >
          <Ikon nama="info" ukuran={20} /> Cek perangkat
        </Link>
        <button
          type="button"
          onClick={() => keluarSekarang("terapis")}
          className="tekan flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold text-oranye-tua hover:bg-background"
        >
          <Ikon nama="keluar" ukuran={20} /> Keluar
        </button>
      </nav>

      <div className="kepala-hijau relative isolate mt-auto overflow-hidden rounded-3xl bg-hijau-tua p-5 text-white">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/15">
            <Ikon nama="ponsel" ukuran={18} />
          </span>
          <p className="judul text-[18px] font-extrabold leading-tight">Keluarga berlatih di ponsel</p>
          <p className="text-[13px] leading-snug text-teks-di-hijau">Undang keluarga dari halaman anak dengan kode atau QR.</p>
        </div>
      </div>
    </aside>
  );
}
