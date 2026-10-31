"use client";

import { Merek } from "./merek";
import { Inisial } from "./inisial";
import { Ikon } from "./ikon";
import { keluarSekarang } from "@/lib/perangkat/sesi-contoh";

// Kepala halaman untuk panel laptop (dasbor terapis dan admin): merek, nama panel, siapa yang masuk, dan Keluar.
export function TopbarPanel({ panel, nama, sebagai }: { panel: string; nama?: string; sebagai: "terapis" | "admin" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-garis bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Merek />
        <span className="hidden rounded-full bg-hijau-muda px-2.5 py-0.5 text-[12px] font-semibold text-hijau-tua sm:inline">{panel}</span>
        <div className="ml-auto flex items-center gap-2">
          {nama ? (
            <span className="hidden items-center gap-2 text-[14px] font-medium sm:flex">
              <Inisial nama={nama} ukuran={32} nada={sebagai === "admin" ? "oranye" : "abu"} />
              {nama}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => keluarSekarang(sebagai)}
            className="tekan inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-[14px] font-semibold text-oranye-tua ring-1 ring-garis hover:bg-permukaan"
          >
            <Ikon nama="kembali" ukuran={18} /> Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
