"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as g from "@/lib/gaya";
import { Inisial } from "./inisial";
import { Ikon } from "./ikon";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { API } from "@/lib/kontrak/api";
import { lupakanSaya } from "@/lib/perangkat/saya";

const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export type Persona = "ibu_sari" | "mbak_sri" | "kak_nadia";

const PERSONA: { sebagai: Persona; nama: string; peran: string; tujuan: string }[] = [
  { sebagai: "ibu_sari", nama: "Ibu Sari", peran: "Ibu Raka · pengelola keluarga", tujuan: "/hari-ini" },
  { sebagai: "mbak_sri", nama: "Mbak Sri", peran: "Pengasuh Raka", tujuan: "/hari-ini" },
  { sebagai: "kak_nadia", nama: "Kak Nadia", peran: "Terapis wicara", tujuan: "/terapis" },
];

/** Kotak "Mode demo · data contoh" di beranda. Hanya tampil bila NEXT_PUBLIC_DEMO=1. */
export function ModeDemo() {
  const router = useRouter();
  const [proses, setProses] = useState<Persona | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  if (!DEMO) return null;

  async function pilih(p: (typeof PERSONA)[number]) {
    setGalat(null);
    setProses(p.sebagai);
    try {
      await panggil(API.demo, { sebagai: p.sebagai });
      lupakanSaya();
      router.push(p.tujuan);
    } catch (e) {
      setGalat(pesanDari(e));
      setProses(null);
    }
  }

  return (
    <section className="muncul space-y-2 [animation-delay:120ms]" aria-labelledby="judul-demo">
      <h2 id="judul-demo" className={g.labelSeksi}>
        Mode demo · data contoh
      </h2>
      <div className={g.daftar}>
        {PERSONA.map((p) => (
          <button
            key={p.sebagai}
            type="button"
            onClick={() => pilih(p)}
            disabled={proses !== null}
            className={`${g.barisDaftar} tekan w-full text-left disabled:opacity-60`}
          >
            <Inisial nama={p.nama} nada={p.sebagai === "kak_nadia" ? "abu" : "hijau"} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{p.nama}</span>
              <span className="block text-[14px] text-abu">{p.peran}</span>
            </span>
            {proses === p.sebagai ? (
              <span className="text-[13px] text-abu">Membuka…</span>
            ) : (
              <Ikon nama="panah-kanan" ukuran={18} className="text-abu" />
            )}
          </button>
        ))}
      </div>
      <p className="px-1 text-[13px] leading-snug text-abu">
        Semua nama dan angka di mode demo adalah data contoh. Hanya bagian menunggu yang dipercepat.
      </p>
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
    </section>
  );
}
