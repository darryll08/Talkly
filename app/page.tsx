import Link from "next/link";
import * as g from "@/lib/gaya";
import { Ikon, type NamaIkon } from "@/components/ikon";
import { Merek, PratinjauHasil } from "@/components/merek";

const LANGKAH: { ikon: NamaIkon; judul: string; isi: string }[] = [
  { ikon: "mikrofon", judul: "Rekam satu menit", isi: "Saat makan atau bermain, ponsel merekam percakapan Anda dengan anak." },
  { ikon: "bintang", judul: "Lihat yang berhasil", isi: "Kata yang diucapkan anak dan kapan Anda memberi jeda, tanpa skor." },
  { ikon: "pesan", judul: "Terapis ikut memantau", isi: "Terapis melihat ringkasannya dan menyesuaikan latihan minggu depan." },
];

// Beranda publik: menjelaskan Talkly dalam satu layar, lalu satu pintu ke halaman masuk.
// Yang sudah masuk langsung diarahkan proxy.ts ke Hari ini atau dasbor terapis.
export default function Beranda() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-8">
        <Merek />
        <Link href="/masuk" className={`${g.tombolTeks} rounded-xl px-4 ring-1 ring-garis`}>
          Masuk
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[1.1fr_1fr]">
        <section className="muncul space-y-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-hijau-tua">Untuk anak dengan keterlambatan bicara</p>
          <h1 className="text-[36px] font-bold leading-[1.12] sm:text-[48px]">
            Latihan bicara dari terapis, dilanjutkan di rumah.
          </h1>
          <p className="max-w-lg text-[17px] leading-relaxed text-abu">
            Terapi wicara hanya sejam seminggu. Talkly membantu keluarga berlatih setiap hari: rekam satu menit saat
            bermain, lihat apa yang sudah berhasil, dan coba langkah berikutnya besok.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/masuk" className={`${g.tombolUtama} sm:w-auto sm:px-8`}>
              Masuk
            </Link>
            <Link href="/gabung" className={`${g.tombolKedua} sm:w-auto sm:px-8`}>
              Punya kode undangan
            </Link>
          </div>
        </section>
        <div className="muncul flex justify-center [animation-delay:80ms] lg:justify-end">
          <PratinjauHasil />
        </div>
      </main>

      <section className="border-t border-garis bg-permukaan">
        <ol className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-8">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="space-y-2">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-hijau-muda text-hijau-tua">
                <Ikon nama={l.ikon} ukuran={22} />
              </span>
              <h2 className="pt-1 text-[17px] font-semibold">
                {i + 1}. {l.judul}
              </h2>
              <p className="text-[15px] leading-relaxed text-abu">{l.isi}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-[14px] text-abu sm:px-8">
        <span>Talkly · INCEPTION 2026</span>
        <Link href="/cek-perangkat" className="inline-flex items-center gap-1 font-semibold text-hijau-tua">
          <Ikon nama="info" ukuran={16} /> Cek perangkat
        </Link>
      </footer>
    </div>
  );
}
