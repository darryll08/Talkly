"use client";

import Link from "next/link";
import { Inisial } from "./inisial";
import { Ikon } from "./ikon";
import { DEMO } from "./mode-demo";
import { useSaya } from "@/lib/perangkat/saya";
import { keluarSekarang } from "@/lib/perangkat/sesi-contoh";

const PERAN: Record<string, string> = { ibu: "Ibu", ayah: "Ayah", pengasuh: "Pengasuh", nenek: "Nenek", kakek: "Kakek", lainnya: "Anggota keluarga" };

// Avatar di kepala O3 dengan menu: siapa yang masuk, profil, ganti akun demo, keluar.
export function MenuAkun() {
  const { data } = useSaya();
  if (!data) return <span className="size-10 shrink-0 rounded-full bg-abu-muda" aria-hidden="true" />;
  const { anggota, anak } = data;

  return (
    <details className="group relative shrink-0">
      <summary
        className="tekan flex cursor-pointer list-none rounded-full ring-hijau/30 group-open:ring-4 [&::-webkit-details-marker]:hidden"
        aria-label={`Akun ${anggota.nama}`}
      >
        <Inisial nama={anggota.nama} />
      </summary>
      <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl bg-permukaan shadow-angkat ring-1 ring-garis">
        <div className="space-y-0.5 border-b border-garis px-4 py-3">
          <p className="font-semibold">{anggota.nama}</p>
          <p className="text-[13px] leading-snug text-abu">
            {PERAN[anggota.peran] ?? "Anggota"} {anak.nama}
            {anggota.pengelola ? " · pengelola" : ""}
          </p>
        </div>
        <Link href="/profil" className="flex min-h-12 items-center gap-3 px-4 text-[15px] hover:bg-background">
          <Ikon nama="orang" ukuran={20} className="text-abu" /> Profil dan izin
        </Link>
        {DEMO ? (
          <button
            type="button"
            onClick={() => keluarSekarang()}
            className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px] hover:bg-background"
          >
            <Ikon nama="keluarga" ukuran={20} className="text-abu" /> Ganti akun demo
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => keluarSekarang()}
          className="flex min-h-12 w-full items-center gap-3 border-t border-garis px-4 text-left text-[15px] font-semibold text-oranye-tua hover:bg-background"
        >
          <Ikon nama="kembali" ukuran={20} /> Keluar
        </button>
      </div>
    </details>
  );
}
