"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as g from "@/lib/gaya";
import { Inisial } from "./inisial";
import { Ikon } from "./ikon";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { API } from "@/lib/kontrak/api";
import { lupakanSaya } from "@/lib/perangkat/saya";
import { tandaiMasukContoh } from "@/lib/perangkat/sesi-contoh";

export const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export type Persona = "ibu_sari" | "mbak_sri" | "ibu_alya" | "ibu_bima" | "ibu_citra" | "kak_nadia" | "admin";

type Sesi = "anggota" | "terapis" | "admin";

const PERSONA: { sebagai: Persona; nama: string; peran: string; tujuan: string; sesi: Sesi }[] = [
  { sebagai: "ibu_sari", nama: "Ibu Sari", peran: "Ibu Raka · riwayat 3 minggu", tujuan: "/hari-ini", sesi: "anggota" },
  { sebagai: "mbak_sri", nama: "Mbak Sri", peran: "Pengasuh Raka", tujuan: "/hari-ini", sesi: "anggota" },
  { sebagai: "ibu_alya", nama: "Ibu Alya", peran: "Ibu Alya · kata lama hilang, dibahas minggu ini", tujuan: "/hari-ini", sesi: "anggota" },
  { sebagai: "ibu_bima", nama: "Ibu Bima", peran: "Ibu Bima · 5 hari belum latihan", tujuan: "/hari-ini", sesi: "anggota" },
  { sebagai: "ibu_citra", nama: "Ibu Citra", peran: "Ibu Citra · baru mulai program", tujuan: "/hari-ini", sesi: "anggota" },
  { sebagai: "kak_nadia", nama: "Kak Nadia", peran: "Terapis wicara · 25 anak", tujuan: "/terapis", sesi: "terapis" },
  { sebagai: "admin", nama: "Admin Talkly", peran: "Kelola klinik dan akun terapis", tujuan: "/admin", sesi: "admin" },
];

/** Kartu "Akun demo" di halaman masuk: satu klik masuk sebagai persona. Hanya tampil bila NEXT_PUBLIC_DEMO=1. */
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
      tandaiMasukContoh(p.sesi);
      lupakanSaya();
      router.replace(p.tujuan);
    } catch (e) {
      setGalat(pesanDari(e));
      setProses(null);
    }
  }

  return (
    <section id="demo" className="space-y-2" aria-labelledby="judul-demo">
      <div className="flex items-center justify-between px-1">
        <h2 id="judul-demo" className="text-[15px] font-semibold">
          Akun demo
        </h2>
        <span className="rounded-full bg-hijau-muda px-2.5 py-0.5 text-[12px] font-semibold text-hijau-tua">tanpa kata sandi</span>
      </div>
      <div className={g.daftar}>
        {PERSONA.map((p) => (
          <button
            key={p.sebagai}
            type="button"
            onClick={() => pilih(p)}
            disabled={proses !== null}
            className={`${g.barisDaftar} tekan w-full text-left hover:bg-background disabled:opacity-60`}
          >
            <Inisial nama={p.nama} nada={p.sesi === "anggota" ? "hijau" : p.sesi === "terapis" ? "abu" : "oranye"} />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{p.nama}</span>
              <span className="block text-[14px] text-abu">{p.peran}</span>
            </span>
            {proses === p.sebagai ? (
              <span className="text-[13px] text-abu">Masuk…</span>
            ) : (
              <Ikon nama="panah-kanan" ukuran={18} className="text-abu" />
            )}
          </button>
        ))}
      </div>
      <p className="px-1 text-[13px] leading-snug text-abu">
        Klik satu akun untuk masuk. Semua nama dan angka di akun demo adalah data contoh.
      </p>
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
    </section>
  );
}
