import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import * as g from "@/lib/gaya";
import { Ikon } from "@/components/ikon";
import { ModeDemo } from "@/components/mode-demo";

// Beranda: pintu masuk keluarga, terapis, dan juri (mode demo).
export default function Beranda() {
  return (
    <main className={`${g.kolomOrtu} flex min-h-dvh flex-col gap-8 pb-10 pt-[calc(env(safe-area-inset-top)+3rem)]`}>
      <header className="muncul flex flex-col items-start gap-5">
        <Image
          src="/logo.svg"
          alt=""
          width={72}
          height={72}
          priority
          className="rounded-[20px] shadow-angkat"
        />
        <div className="space-y-2">
          <h1 className="text-[34px] font-bold">Talkly</h1>
          <p className="text-[17px] leading-relaxed text-abu">
            Latihan bicara di rumah dari terapis anak Anda. Rekam satu menit saat bermain, lalu lihat apa yang sudah
            berhasil dan apa yang bisa dicoba besok.
          </p>
        </div>
      </header>

      <section className="muncul space-y-3 [animation-delay:60ms]">
        <Link href="/gabung" className={g.tombolUtama}>
          Gabung dengan kode undangan
        </Link>
        <Link href="/masuk" className={g.tombolKedua}>
          Masuk dengan kode masuk pribadi
        </Link>
        <Link href="/terapis/masuk" className={`${g.tombolTeks} w-full justify-center`}>
          Masuk sebagai terapis
        </Link>
      </section>

      <Suspense>
        <ModeDemo />
      </Suspense>

      <footer className="mt-auto flex justify-center">
        <Link href="/cek-perangkat" className={`${g.tombolTeks} text-[14px] text-abu`}>
          <Ikon nama="info" ukuran={18} /> Cek perangkat
        </Link>
      </footer>
    </main>
  );
}
