"use client";

import { useEffect, useState } from "react";
import * as g from "@/lib/gaya";
import { Ikon } from "./ikon";

type BeforeInstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let tertunda: BeforeInstallPrompt | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    tertunda = e as BeforeInstallPrompt;
  });
}

export function sudahTerpasang() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

// O2b Pasang di layar utama: beforeinstallprompt bila ada, atau petunjuk menu ⋮ Chrome.
export function PasangAplikasi() {
  const [terpasang, setTerpasang] = useState<boolean | null>(null);
  const [bisaPrompt, setBisaPrompt] = useState(false);

  useEffect(() => {
    const cek = () => {
      setTerpasang(sudahTerpasang());
      setBisaPrompt(tertunda !== null);
    };
    cek();
    const t = setInterval(cek, 1000);
    const saatTerpasang = () => setTerpasang(true);
    window.addEventListener("appinstalled", saatTerpasang);
    return () => {
      clearInterval(t);
      window.removeEventListener("appinstalled", saatTerpasang);
    };
  }, []);

  async function pasang() {
    if (!tertunda) return;
    await tertunda.prompt();
    const pilihan = await tertunda.userChoice;
    tertunda = null;
    setBisaPrompt(false);
    if (pilihan.outcome === "accepted") setTerpasang(true);
  }

  if (terpasang) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-permukaan px-4 py-3 text-foreground ring-1 ring-garis text-[16px] font-semibold">
        <Ikon nama="centang" ukuran={20} /> Talkly sudah ada di layar utama
      </p>
    );
  }

  return (
    <div className={`${g.kartu} space-y-3`}>
      <p className="text-[16px] leading-snug">
        Pasang Talkly di layar utama agar terbuka seperti aplikasi, dan kartu aktivitas tetap bisa dibaca saat sinyal hilang.
      </p>
      {bisaPrompt ? (
        <button type="button" onClick={pasang} className={g.tombolUtama}>
          Pasang di layar utama
        </button>
      ) : (
        <ol className="list-decimal space-y-1 pl-5 text-[15px] text-abu">
          <li>Buka Talkly di Chrome.</li>
          <li>Ketuk menu ⋮ di kanan atas.</li>
          <li>Pilih &quot;Tambahkan ke layar utama&quot; atau &quot;Instal aplikasi&quot;.</li>
        </ol>
      )}
    </div>
  );
}
