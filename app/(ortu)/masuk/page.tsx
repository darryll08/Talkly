"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, GalatApi, pesanDari } from "@/lib/perangkat/panggil";
import { lupakanSaya } from "@/lib/perangkat/saya";

// O1c Masuk di HP baru dengan kode masuk pribadi.
export default function Masuk() {
  const router = useRouter();
  const [kode, setKode] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function masuk(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setGalat(null);
    try {
      await panggil(API.masuk, { kode_masuk: kode.trim() });
      lupakanSaya();
      router.replace("/hari-ini");
    } catch (err) {
      if (err instanceof GalatApi && err.status === 401) setGalat("Kode salah. Periksa lagi huruf dan angkanya.");
      else if (err instanceof GalatApi && err.status === 423) setGalat("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
      else setGalat(pesanDari(err));
      setProses(false);
    }
  }

  return (
    <form onSubmit={masuk} className="muncul space-y-6 pt-10">
      <header className="space-y-1">
        <p className={g.labelAtas}>Talkly</p>
        <h1 className={g.judulHalaman}>Masuk dengan kode masuk</h1>
        <p className="pt-1 text-[16px] text-abu">Kode masuk pribadi Anda dibuat saat pertama kali bergabung.</p>
      </header>
      <input
        className={`${g.isian} py-4 text-center font-mono text-[22px] font-semibold tracking-[0.12em]`}
        value={kode}
        onChange={(e) => setKode(e.target.value.toUpperCase())}
        placeholder="TLK-XXXX-XXXX"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-label="Kode masuk pribadi"
      />
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
      <button type="submit" disabled={kode.trim().length < 6 || proses} className={g.tombolUtama}>
        {proses ? "Memeriksa…" : "Masuk"}
      </button>
      <p className="text-center text-[14px] leading-snug text-abu">
        Lupa kode? Minta pengelola keluarga atau terapis membuat undangan baru.
      </p>
      <Link href="/gabung" className={`${g.tombolTeks} w-full justify-center`}>
        Punya kode undangan? Gabung
      </Link>
    </form>
  );
}
