"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { z } from "zod";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { lupakanSaya } from "@/lib/perangkat/saya";
import { Inisial } from "@/components/inisial";

type Undangan = z.output<NonNullable<(typeof API)["undanganLihat"]["response"]>>;

const NAMA_PERAN: Record<string, string> = {
  ibu: "Ibu",
  ayah: "Ayah",
  pengasuh: "Pengasuh",
  nenek: "Nenek",
  kakek: "Kakek",
  lainnya: "Anggota keluarga",
};

export const KUNCI_KODE_MASUK = "talkly:kode-masuk-baru";

const rapikan = (k: string) => k.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

export function Gabung() {
  const router = useRouter();
  const awal = rapikan(useSearchParams().get("kode") ?? "");
  const [kode, setKode] = useState(awal);
  const [undangan, setUndangan] = useState<Undangan | null>(null);
  const [nama, setNama] = useState("");
  const [proses, setProses] = useState<"diam" | "cek" | "gabung">("diam");
  const [galat, setGalat] = useState<string | null>(null);

  async function cek(k: string) {
    setProses("cek");
    setGalat(null);
    try {
      const u = await panggil(API.undanganLihat, { kode: k });
      if (u.status === "dipakai") setGalat("Kode undangan ini sudah dipakai. Minta undangan baru dari terapis atau pengelola keluarga.");
      else if (u.status === "kedaluwarsa") setGalat("Kode undangan ini sudah kedaluwarsa (berlaku 7 hari). Minta undangan baru.");
      else setUndangan(u);
    } catch (e) {
      setGalat(pesanDari(e));
    } finally {
      setProses("diam");
    }
  }

  // Kode dari QR langsung diperiksa sekali.
  useEffect(() => {
    if (awal.length >= 6) {
      let batal = false;
      panggil(API.undanganLihat, { kode: awal })
        .then((u) => {
          if (batal) return;
          if (u.status === "menunggu") setUndangan(u);
          else setGalat(u.status === "dipakai" ? "Kode undangan ini sudah dipakai." : "Kode undangan ini sudah kedaluwarsa.");
        })
        .catch((e) => !batal && setGalat(pesanDari(e)));
      return () => {
        batal = true;
      };
    }
  }, [awal]);

  async function gabung(e: React.FormEvent) {
    e.preventDefault();
    setProses("gabung");
    setGalat(null);
    try {
      const r = await panggil(API.gabung, { kode, nama: nama.trim() });
      try {
        sessionStorage.setItem(KUNCI_KODE_MASUK, r.kode_masuk);
      } catch {}
      lupakanSaya();
      router.replace("/mulai");
    } catch (err) {
      setGalat(pesanDari(err));
      setProses("diam");
    }
  }

  if (undangan) {
    return (
      <form onSubmit={gabung} className="muncul space-y-6 pt-10">
        <header className="space-y-1">
          <p className={g.labelAtas}>Undangan Talkly</p>
          <h1 className={g.judulHalaman}>Gabung ke program {undangan.anak.nama}</h1>
        </header>
        <ul className={g.daftar}>
          <li className={g.barisDaftar}>
            <Inisial nama={undangan.anak.nama} nada="oranye" />
            <span>
              <span className="block text-[13px] text-abu">Anak</span>
              <span className="block font-semibold">{undangan.anak.nama}</span>
            </span>
          </li>
          <li className={g.barisDaftar}>
            <Inisial nama={undangan.terapis.nama} nada="abu" />
            <span>
              <span className="block text-[13px] text-abu">Terapis</span>
              <span className="block font-semibold">{undangan.terapis.nama}</span>
            </span>
          </li>
          <li className={g.barisDaftar}>
            <Inisial nama={undangan.klinik.nama} nada="abu" />
            <span>
              <span className="block text-[13px] text-abu">Klinik</span>
              <span className="block font-semibold">{undangan.klinik.nama}</span>
            </span>
          </li>
        </ul>
        <p className="rounded-2xl bg-hijau-muda px-4 py-3 text-[16px] text-hijau-tua">
          Anda bergabung sebagai <span className="font-semibold">{NAMA_PERAN[undangan.peran]}</span>
          .
        </p>
        <label className="block space-y-2">
          <span className="block text-[15px] font-semibold">Nama panggilan Anda</span>
          <input
            className={g.isian}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder={undangan.peran === "pengasuh" ? "Misalnya: Mbak Sri" : "Misalnya: Ibu Sari"}
            autoComplete="given-name"
            maxLength={40}
            required
          />
          <span className="block text-[13px] text-abu">Nama ini dilihat terapis dan anggota keluarga lain.</span>
        </label>
        {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
        <button type="submit" disabled={proses !== "diam" || !nama.trim()} className={g.tombolUtama}>
          {proses === "gabung" ? "Bergabung…" : "Gabung"}
        </button>
        <p className="text-center text-[13px] leading-snug text-abu">
          Tidak perlu membuat kata sandi. Setelah ini Anda mendapat kode masuk pribadi.
        </p>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        cek(kode);
      }}
      className="muncul space-y-6 pt-10"
    >
      <header className="space-y-1">
        <p className={g.labelAtas}>Talkly</p>
        <h1 className={g.judulHalaman}>Gabung dengan kode undangan</h1>
        <p className="pt-1 text-[16px] text-abu">Kode ada di bawah QR dari terapis atau pengelola keluarga.</p>
      </header>
      <input
        className={`${g.isian} py-4 text-center font-mono text-[26px] font-semibold tracking-[0.2em]`}
        value={kode}
        onChange={(e) => setKode(rapikan(e.target.value))}
        placeholder="AB12CD34"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="one-time-code"
        aria-label="Kode undangan"
      />
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
      <button type="submit" disabled={kode.length < 6 || proses !== "diam"} className={g.tombolUtama}>
        {proses === "cek" ? "Memeriksa…" : "Lanjut"}
      </button>
      <Link href="/masuk" className={`${g.tombolTeks} w-full justify-center`}>
        Sudah punya akun? Masuk dengan kode masuk
      </Link>
    </form>
  );
}
