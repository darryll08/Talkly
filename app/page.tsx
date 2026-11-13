import Link from "next/link";
import { Ikon, type NamaIkon } from "@/components/ikon";
import { Merek, PratinjauHasil, PratinjauJeda } from "@/components/merek";
import { PemicuGulir } from "@/components/pemicu-gulir";

/** Jeda bergiliran untuk animasi muncul saat digulir (kelas `gulir`), 120 ms per kartu. */
const tunda = (i: number) => ({ "--tunda": `${i * 120}ms` }) as React.CSSProperties;

// Satu putaran mingguan, dari rumah ke ruang terapi. Tiap langkah menyebut siapa yang melakukannya.
const LANGKAH: { ikon: NamaIkon; pelaku: string; judul: string; isi: string }[] = [
  {
    ikon: "mikrofon",
    pelaku: "Keluarga",
    judul: "Rekam satu menit",
    isi: "Saat makan atau bermain, ponsel merekam percakapan orang tua dengan anak. Anak tetap bermain seperti biasa.",
  },
  {
    ikon: "bintang",
    pelaku: "Talkly",
    judul: "Ukur cara orang tua bicara",
    isi: "Berapa kali mengajak, berapa lama menunggu jawaban, dan giliran percakapan. Hasilnya satu pujian dan satu saran, tanpa skor.",
  },
  {
    ikon: "pesan",
    pelaku: "Terapis",
    judul: "Sesuaikan minggu depan",
    isi: "Terapis membaca ringkasannya sebelum sesi, lalu menyetujui rencana latihan berikutnya untuk keluarga.",
  },
];

const FAKTA: { nilai: string; label: string }[] = [
  { nilai: "1 menit", label: "rekaman, 2–3 kali seminggu" },
  { nilai: "5 menit", label: "aktivitas di rutinitas harian" },
  { nilai: "0 layar", label: "untuk anak, ponsel melatih orang tua" },
];

const TERAPIS: { judul: string; isi: string }[] = [
  { judul: "Kartu anak sebelum sesi", isi: "Jeda, ajakan yang berhasil, dan giliran percakapan 14 hari, dibaca dalam tiga menit." },
  { judul: "Rencana minggu depan", isi: "Draf dari bank aktivitas, terkirim ke keluarga hanya setelah Anda menyetujuinya." },
  { judul: "Laporan keluarga terpisah", isi: "Cerita keluarga tidak bercampur dengan angka terukur dari rekaman." },
];

// Beranda publik: menjelaskan Talkly untuk keluarga dan terapis, lalu satu pintu ke halaman masuk.
// Yang sudah masuk langsung diarahkan proxy.ts ke Hari ini atau dasbor terapis.
export default function Beranda() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PemicuGulir />
      <div className="kepala-hijau relative isolate overflow-hidden rounded-b-[40px] bg-hijau-tua text-white">
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-8">
          <Merek terang />
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#terapis" className="hidden min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold text-teks-di-hijau hover:text-white sm:inline-flex">
              Untuk terapis
            </a>
            <Link href="/masuk" className="tekan inline-flex min-h-11 items-center rounded-full bg-permukaan px-5 text-[15px] font-semibold text-hijau-tua">
              Masuk
            </Link>
          </nav>
        </header>

        <main className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:pb-24 lg:pt-16">
          <section className="muncul space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-hijau px-3 py-1 text-[14px] font-semibold text-white">
              <Ikon nama="perisai" ukuran={16} /> Diberikan klinik, untuk anak 18–48 bulan
            </p>
            {/* Dua baris di layar sm ke atas: baris pertama tidak boleh patah. */}
            <h1 className="text-[40px] font-extrabold leading-[1.1] sm:text-[48px] lg:text-[44px] xl:text-[50px]">
              <span className="sm:whitespace-nowrap">Ponsel melatih orang tua,</span>{" "}
              <span className="underline decoration-oranye decoration-[5px] underline-offset-[10px] sm:block">bukan anak.</span>
            </h1>
            <p className="max-w-lg text-[17px] leading-relaxed text-teks-di-hijau">
              Terapi wicara hanya sejam seminggu; sisanya terjadi di rumah. Orang tua merekam satu menit saat bermain, Talkly mengukur
              berapa lama mereka menunggu anak menjawab, dan terapis membacanya sebelum sesi berikutnya.
            </p>
            <p className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Ikon nama="centang" ukuran={18} /> Anak tidak memakai layar sama sekali.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/masuk"
                className="tekan inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-oranye px-8 text-base font-semibold text-foreground shadow-angkat"
              >
                Masuk
                <Ikon nama="panah-kanan" ukuran={20} />
              </Link>
              <Link
                href="/gabung"
                className="tekan inline-flex min-h-14 items-center justify-center rounded-full px-8 text-base font-semibold text-white ring-1 ring-hijau-lembut"
              >
                Punya kode undangan
              </Link>
            </div>
          </section>

          {/* Satu momen bukti: rekaman 1 menit → jeda menunggu terukur → satu saran untuk besok. */}
          <figure className="muncul relative mx-auto w-full max-w-[520px] [animation-delay:80ms]" aria-label="Contoh hasil satu rekaman">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[14px] font-semibold text-white">
              <Ikon nama="mikrofon" ukuran={16} /> Dari satu rekaman sore, 1 menit
            </p>
            {/* Dua kartu terpisah, tidak bertumpuk: berdampingan di layar lebar, atas-bawah di ponsel. */}
            <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] [&>div>div]:h-full [&>div>div]:max-w-none">
              <div>
                <PratinjauJeda />
              </div>
              <div>
                <PratinjauHasil />
              </div>
            </div>
            <figcaption className="mt-5 text-[14px] leading-relaxed text-teks-di-hijau">
              Orang tua melihat apa yang sudah berhasil dan satu hal untuk dicoba besok. Data contoh.
            </figcaption>
          </figure>
        </main>
      </div>

      <section aria-label="Talkly dalam angka" className="relative z-10 mx-auto -mt-10 w-full max-w-6xl px-4 sm:px-8">
        <dl className="grid divide-y divide-garis rounded-3xl bg-permukaan shadow-tumpuk sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {FAKTA.map((f, i) => (
            <div key={f.nilai} className="gulir px-6 py-5" style={tunda(i)}>
              <dt className="font-judul text-[30px] font-extrabold leading-none text-hijau-tua">{f.nilai}</dt>
              <dd className="mt-1 text-[15px] text-abu">{f.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-16 sm:px-8">
        <div className="gulir space-y-2">
          <p className="text-[15px] font-semibold text-oranye-tua">Cara kerjanya</p>
          <h2 className="judul max-w-xl text-[34px] font-extrabold leading-tight">Satu putaran, dari rumah ke ruang terapi</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="gulir space-y-4 rounded-3xl bg-permukaan p-6 shadow-kartu" style={tunda(i)}>
              <div className="flex items-center justify-between">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-hijau-muda text-hijau-tua">
                  <Ikon nama={l.ikon} ukuran={24} />
                </span>
                <span className="text-[14px] font-semibold text-abu">
                  {i + 1} · {l.pelaku}
                </span>
              </div>
              <h3 className="judul text-[22px] font-extrabold">{l.judul}</h3>
              <p className="text-[15px] leading-relaxed text-abu">{l.isi}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="terapis" className="scroll-mt-6 bg-permukaan">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="gulir space-y-2">
              <p className="text-[15px] font-semibold text-oranye-tua">Untuk terapis</p>
              <h2 className="judul text-[34px] font-extrabold leading-tight">Tahu apa yang terjadi di rumah sebelum sesi dimulai</h2>
            </div>
            <ul className="space-y-4">
              {TERAPIS.map((t, i) => (
                <li key={t.judul} className="gulir flex gap-4" style={tunda(i + 1)}>
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-hijau text-white">
                    <Ikon nama="centang" ukuran={16} />
                  </span>
                  <span>
                    <span className="block text-[17px] font-bold">{t.judul}</span>
                    <span className="block text-[15px] leading-relaxed text-abu">{t.isi}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="gulir" style={tunda(1)}>
            <PratinjauDasbor />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8">
        <div className="gulir kepala-hijau relative isolate flex flex-col items-start gap-6 overflow-hidden rounded-[32px] bg-hijau-tua p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="relative z-10 space-y-2">
            <h2 className="judul text-[30px] font-extrabold leading-tight">Sudah diundang terapis?</h2>
            <p className="text-[16px] text-teks-di-hijau">Masukkan kode undangan atau pindai QR dari klinik. Tanpa kata sandi.</p>
          </div>
          <Link
            href="/gabung"
            className="tekan relative z-10 inline-flex min-h-14 shrink-0 items-center gap-2 rounded-full bg-permukaan px-7 font-semibold text-hijau-tua"
          >
            Gabung dengan kode <Ikon nama="panah-kanan" ukuran={20} />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-[14px] text-abu sm:px-8">
        <Merek />
        <Link href="/cek-perangkat" className="inline-flex items-center gap-1 font-semibold text-hijau-tua">
          <Ikon nama="info" ukuran={16} /> Cek perangkat
        </Link>
      </footer>
    </div>
  );
}

/** Potongan dasbor terapis (data contoh) untuk bagian terapis di beranda. */
function PratinjauDasbor() {
  const angka: [string, number, string][] = [
    ["Anak", 10, "bg-hijau-tua text-white"],
    ["Bahas", 1, "bg-permukaan shadow-kartu text-oranye-tua"],
    ["Ditinjau", 2, "bg-permukaan shadow-kartu text-foreground"],
  ];
  return (
    <div className="space-y-4 rounded-[32px] bg-background p-5 ring-1 ring-garis sm:p-6" aria-label="Contoh dasbor terapis">
      <div className="flex items-center justify-between">
        <p className="judul text-[22px] font-extrabold">Minggu ini</p>
        <span className="rounded-full bg-abu-muda px-2.5 py-0.5 text-[13px] font-semibold text-abu">Data contoh</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {angka.map(([label, n, kelas]) => (
          <div key={label} className={`rounded-2xl p-4 ${kelas}`}>
            <p className="text-[13px] font-semibold opacity-80">{label}</p>
            <p className="font-judul text-[34px] font-extrabold leading-none">{n}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-2">
        {[
          ["08.00", "Raka", "Terapis meninjau", "bg-abu-muda text-foreground"],
          ["08.15", "Alya", "Bahas minggu ini", "bg-oranye-muda text-oranye-tua"],
          ["08.30", "Bima", "Lanjut", "ring-1 ring-garis text-foreground"],
        ].map(([jam, nama, status, kelas]) => (
          <li key={nama} className="flex items-center gap-3 rounded-2xl bg-permukaan px-4 py-3 shadow-kartu">
            <span className="w-12 text-[14px] font-bold tabular-nums">{jam}</span>
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-hijau text-[13px] font-semibold text-white">
              {nama.slice(0, 2).toUpperCase()}
            </span>
            <span className="flex-1 font-semibold">{nama}</span>
            <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${kelas}`}>{status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
