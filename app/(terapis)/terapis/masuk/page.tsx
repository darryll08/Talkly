"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari, PAKAI_CONTOH } from "@/lib/perangkat/panggil";
import * as g from "@/lib/gaya";

export default function MasukTerapis() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");
  async function masuk(event: FormEvent) {
    event.preventDefault();
    setSibuk(true);
    setGalat("");
    try {
      await panggil(API.terapisMasuk, {
        email: email.trim(),
        kata_sandi: kataSandi,
      });
      router.replace("/terapis");
    } catch (error) {
      setGalat(pesanDari(error));
      setSibuk(false);
    }
  }
  return (
    <section className="mx-auto max-w-md space-y-6 py-10">
      <header>
        <p className={g.labelAtas}>Talkly · Dasbor terapis</p>
        <h1 className={g.judulHalaman}>Masuk terapis</h1>
      </header>
      {PAKAI_CONTOH && (
        <p className={g.kotakGalat}>
          Mode data contoh. Formulir ini tidak memverifikasi akun nyata.
        </p>
      )}
      <form onSubmit={masuk} className="space-y-5">
        <label className="block space-y-2">
          <span>Email</span>
          <input
            className={g.isian}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block space-y-2">
          <span>Kata sandi</span>
          <input
            className={g.isian}
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            maxLength={100}
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
          />
        </label>
        {galat && (
          <p role="alert" className={g.kotakGalat}>
            {galat}
          </p>
        )}
        <button
          className={g.tombolUtama}
          disabled={sibuk || !email.trim() || kataSandi.length < 6}
        >
          {sibuk ? "Memeriksa…" : "Masuk"}
        </button>
      </form>
      <Link href="/" className={g.tombolTeks}>
        ‹ Beranda Talkly
      </Link>
    </section>
  );
}
