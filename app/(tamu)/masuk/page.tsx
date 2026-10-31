"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, GalatApi, pesanDari, PAKAI_CONTOH } from "@/lib/perangkat/panggil";
import { lupakanSaya } from "@/lib/perangkat/saya";
import { tandaiMasukContoh } from "@/lib/perangkat/sesi-contoh";
import { Merek, PratinjauHasil } from "@/components/merek";
import { ModeDemo } from "@/components/mode-demo";
import { Ikon } from "@/components/ikon";

// Satu pintu masuk untuk keluarga (kode masuk pribadi, O1c) dan terapis (email + kata sandi), plus akun demo.
export default function HalamanMasuk() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="kepala-hijau relative isolate hidden overflow-hidden bg-hijau-tua px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10">
          <Merek terang />
        </div>
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <p className="text-[15px] font-semibold text-teks-di-hijau">Latihan bicara di rumah</p>
            <h2 className="judul max-w-md text-[48px] font-extrabold leading-[1.05]">
              Satu menit bermain, satu langkah lebih dekat ke kata pertama.
            </h2>
          </div>
          <div className="rotate-[-3deg] transition-transform duration-500 ease-pantul hover:rotate-0">
            <PratinjauHasil />
          </div>
        </div>
        <ul className="relative z-10 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium">
          <li className="flex items-center gap-2"><Ikon nama="mikrofon" ukuran={18} /> Rekam saat bermain</li>
          <li className="flex items-center gap-2"><Ikon nama="pesan" ukuran={18} /> Langsung ke terapis</li>
          <li className="flex items-center gap-2"><Ikon nama="keluarga" ukuran={18} /> Untuk seluruh keluarga</li>
        </ul>
      </aside>

      <main className="mx-auto flex w-full max-w-md flex-col gap-7 px-4 pb-10 lg:justify-center lg:py-12">
        <div className="kepala-hijau relative isolate -mx-4 overflow-hidden rounded-b-[32px] bg-hijau-tua px-5 pb-16 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-white lg:hidden">
          <div className="relative z-10 space-y-5">
            <Merek terang />
            <p className="font-judul max-w-xs text-[28px] font-extrabold leading-[1.1]">
              Satu menit bermain, satu langkah lebih dekat ke kata pertama.
            </p>
          </div>
        </div>
        <Suspense>
          <Formulir />
        </Suspense>
        <ModeDemo />
        <p className="text-center text-[14px] text-abu">
          <Link href="/cek-perangkat" className="font-semibold text-hijau-tua underline-offset-4 hover:underline">
            Cek apakah ponsel ini siap merekam
          </Link>
        </p>
      </main>
    </div>
  );
}

type Jenis = "keluarga" | "email";

function Formulir() {
  const cari = useSearchParams();
  const awal = cari.get("sebagai");
  const [jenis, setJenis] = useState<Jenis>(awal === "terapis" || awal === "admin" ? "email" : "keluarga");
  const sudahKeluar = cari.get("keluar") === "1";

  return (
    <section className="muncul relative z-10 -mt-20 space-y-5 rounded-3xl bg-permukaan p-5 shadow-tumpuk lg:mt-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <header className="space-y-1">
        <h1 className={g.judulHalaman}>Masuk ke Talkly</h1>
        <p className="text-[16px] text-abu">{SUBJUDUL[jenis]}</p>
      </header>

      {sudahKeluar ? (
        <p role="status" className="rounded-2xl bg-hijau-muda px-4 py-3 text-[15px] text-hijau-tua">
          Anda sudah keluar. Sampai jumpa lagi.
        </p>
      ) : null}

      <div role="tablist" aria-label="Masuk sebagai" className="grid grid-cols-2 gap-1 rounded-2xl bg-abu-muda p-1">
        {(["keluarga", "email"] as const).map((j) => (
          <button
            key={j}
            type="button"
            role="tab"
            aria-selected={jenis === j}
            onClick={() => setJenis(j)}
            className={`tekan min-h-11 rounded-xl text-[15px] font-semibold ${
              jenis === j ? "bg-permukaan text-hijau-tua shadow-kartu" : "text-abu"
            }`}
          >
            {LABEL[j]}
          </button>
        ))}
      </div>

      {jenis === "keluarga" ? <MasukKeluarga /> : <MasukEmail />}
    </section>
  );
}

const LABEL: Record<Jenis, string> = { keluarga: "Keluarga", email: "Terapis / Admin" };
const SUBJUDUL: Record<Jenis, string> = {
  keluarga: "Lanjutkan latihan bicara anak Anda.",
  email: "Masuk dengan email dan kata sandi dari admin Talkly.",
};

function MasukKeluarga() {
  const router = useRouter();
  const [kode, setKode] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function masuk(e: FormEvent) {
    e.preventDefault();
    setProses(true);
    setGalat(null);
    try {
      await panggil(API.masuk, { kode_masuk: kode.trim() });
      tandaiMasukContoh("anggota");
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
    <form onSubmit={masuk} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-[15px] font-medium">Kode masuk pribadi</span>
        <input
          className={`${g.isian} py-4 text-center font-mono text-[20px] font-semibold tracking-[0.12em]`}
          value={kode}
          onChange={(e) => setKode(e.target.value.toUpperCase())}
          placeholder="TLK-XXXX-XXXX"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {galat ? <p role="alert" className={g.kotakGalat}>{galat}</p> : null}
      <button type="submit" disabled={kode.trim().length < 6 || proses} className={g.tombolUtama}>
        {proses ? "Memeriksa…" : "Masuk"}
      </button>
      <p className="text-center text-[14px] leading-snug text-abu">
        Baru diundang terapis atau keluarga?{" "}
        <Link href="/gabung" className="font-semibold text-hijau-tua underline-offset-4 hover:underline">
          Gabung dengan kode undangan
        </Link>
      </p>
    </form>
  );
}

/**
 * Terapis dan admin sama-sama masuk dengan email + kata sandi, jadi satu formulir. Akun dicoba sebagai terapis dulu;
 * bila bukan terapis (401), dicoba sebagai admin. Tujuan setelah masuk mengikuti akun yang cocok.
 */
async function masukDenganEmail(email: string, kata_sandi: string): Promise<"terapis" | "admin"> {
  // Mode data contoh menerima semua akun, jadi perannya ditebak dari alamat email.
  if (PAKAI_CONTOH) return email.startsWith("admin") ? "admin" : "terapis";
  try {
    await panggil(API.terapisMasuk, { email, kata_sandi });
    return "terapis";
  } catch (err) {
    if (!(err instanceof GalatApi && err.status === 401)) throw err;
  }
  await panggil(API.adminMasuk, { email, kata_sandi });
  return "admin";
}

function MasukEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function masuk(e: FormEvent) {
    e.preventDefault();
    setProses(true);
    setGalat(null);
    try {
      const peran = await masukDenganEmail(email.trim(), kataSandi);
      tandaiMasukContoh(peran);
      router.replace(peran === "admin" ? "/admin" : "/terapis");
    } catch (err) {
      setGalat(err instanceof GalatApi && err.status === 401 ? "Email atau kata sandi salah." : pesanDari(err));
      setProses(false);
    }
  }

  return (
    <form onSubmit={masuk} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-[15px] font-medium">Email</span>
        <input
          className={g.isian}
          type="email"
          autoComplete="username"
          placeholder="nama@klinik.id"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-[15px] font-medium">Kata sandi</span>
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
      {galat ? <p role="alert" className={g.kotakGalat}>{galat}</p> : null}
      <button type="submit" disabled={proses || !email.trim() || kataSandi.length < 6} className={g.tombolUtama}>
        {proses ? "Memeriksa…" : "Masuk"}
      </button>
      <p className="text-center text-[14px] leading-snug text-abu">
        Terapis diarahkan ke dasbor anak, admin ke panel admin. Akun terapis dibuat oleh admin Talkly.
      </p>
    </form>
  );
}
