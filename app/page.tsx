import Link from "next/link";
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
      <div className="kepala-hijau relative isolate overflow-hidden rounded-b-[40px] bg-hijau-tua text-white">
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-8">
          <Merek terang />
          <Link href="/masuk" className="tekan inline-flex min-h-11 items-center rounded-xl bg-permukaan px-5 text-[15px] font-semibold text-hijau-tua">
            Masuk
          </Link>
        </header>

        <main className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pb-20">
          <section className="muncul space-y-6">
            <p className="text-[15px] font-semibold text-teks-di-hijau">Untuk anak dengan keterlambatan bicara</p>
            <h1 className="text-[42px] font-extrabold leading-[1.05] sm:text-[60px]">
              Latihan bicara dari terapis, dilanjutkan di rumah.
            </h1>
            <p className="max-w-lg text-[17px] leading-relaxed text-teks-di-hijau">
              Terapi wicara hanya sejam seminggu. Talkly membantu keluarga berlatih setiap hari: rekam satu menit saat
              bermain, lihat apa yang sudah berhasil, dan coba langkah berikutnya besok.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/masuk" className="tekan inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-oranye px-8 text-base font-semibold text-foreground shadow-angkat">
                Masuk
                <Ikon nama="panah-kanan" ukuran={20} />
              </Link>
              <Link href="/gabung" className="tekan inline-flex min-h-14 items-center justify-center rounded-2xl px-8 text-base font-semibold text-white ring-1 ring-hijau-lembut">
                Punya kode undangan
              </Link>
            </div>
          </section>
          <div className="muncul flex justify-center [animation-delay:80ms] lg:justify-end">
            <div className="rotate-[-3deg] transition-transform duration-500 ease-pantul hover:rotate-0">
              <PratinjauHasil />
            </div>
          </div>
        </main>
      </div>

      <section>
        <ol className="mx-auto grid w-full max-w-6xl gap-x-10 gap-y-8 px-4 py-14 sm:grid-cols-3 sm:px-8">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="space-y-2">
              <span className="flex items-center gap-3">
                <span className="font-judul text-[44px] font-extrabold leading-none text-oranye-tua">{i + 1}</span>
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-hijau-muda text-hijau-tua">
                  <Ikon nama={l.ikon} ukuran={22} />
                </span>
              </span>
              <h2 className="judul pt-1 text-[22px] font-extrabold">{l.judul}</h2>
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
