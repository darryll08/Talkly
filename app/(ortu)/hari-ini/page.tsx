"use client";

import Link from "next/link";
import * as g from "@/lib/gaya";
import { api } from "@/lib/perangkat/sementara/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { Ikon, type NamaIkon } from "@/components/ikon";

function salam(jam: number) {
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

const PINTASAN: { href: string; label: string; ikon: NamaIkon }[] = [
  { href: "/catatan-malam", label: "Catatan malam", ikon: "bulan" },
  { href: "/ceritakan", label: "Ceritakan sendiri", ikon: "pena" },
  { href: "/kartu-benda", label: "Kartu foto benda", ikon: "kamera" },
  { href: "/pesan", label: "Pesan terapis", ikon: "pesan" },
];

// O3 Hari ini: cukup menjawab apa yang perlu dikerjakan hari ini. Tanpa skor.
export default function HariIni() {
  const { data, galat, dariCache } = useData(api.hariIni, undefined, { simpanLokal: "hari-ini" });

  if (galat && !data) return <div className={`${g.kotakGalat} mt-6`}>{galat}</div>;
  if (!data) return <Memuat />;

  const nama = data.anggota.nama.replace(/^(Ibu|Bu|Mbak|Bapak|Pak|Mas)\s+/i, "");
  const belum = data.aktivitas.filter((a) => !a.selesai_hari_ini);
  const berikutnya = belum[0];
  const lain = data.aktivitas.filter((a) => a !== berikutnya);
  const jumlahSelesai = data.aktivitas.length - belum.length;
  const semuaSelesai = data.aktivitas.length > 0 && belum.length === 0;

  return (
    <div className="muncul space-y-5 pt-6">
      <header className="space-y-1">
        <p className={g.labelAtas}>
          {salam(new Date().getHours())}, {nama}
        </p>
        <h1 className={g.judulHalaman}>Latihan {data.anak.nama}</h1>
        {data.aktivitas.length > 0 ? (
          <div className="flex items-center gap-3 pt-2" aria-label={`${jumlahSelesai} dari ${data.aktivitas.length} aktivitas hari ini`}>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-abu-muda">
              <div
                className="h-full rounded-full bg-hijau transition-[width] duration-500 ease-pegas"
                style={{ width: `${(jumlahSelesai / data.aktivitas.length) * 100}%` }}
              />
            </div>
            <span className="text-[13px] tabular-nums text-abu">
              {jumlahSelesai} dari {data.aktivitas.length} aktivitas
            </span>
          </div>
        ) : null}
      </header>

      {dariCache ? (
        <p className={g.kotakGalat}>Belum tersambung. Ini data terakhir yang tersimpan di ponsel.</p>
      ) : null}

      {data.rencana ? (
        <section className={`${g.kartu} flex gap-3`}>
          <Inisial nama={data.terapis.nama} nada="abu" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-hijau-tua">
              {data.rencana.baru ? `Rencana minggu baru dari ${data.terapis.nama}` : `Pesan ${data.terapis.nama}`}
            </p>
            <p className="mt-1 text-[16px] leading-snug">{data.rencana.pesan_keluarga}</p>
          </div>
        </section>
      ) : (
        <section className={`${g.kartu} text-[16px] text-abu`}>
          {data.terapis.nama} belum mengirim rencana minggu ini.
        </section>
      )}

      {berikutnya ? (
        <Link
          href={`/aktivitas/${berikutnya.item_id}`}
          className="tekan block rounded-3xl bg-gradient-to-br from-hijau to-hijau-tua p-5 text-white shadow-angkat"
        >
          <p className="text-[13px] font-semibold text-white/80">Berikutnya · {berikutnya.rutinitas}</p>
          <p className="mt-1 text-[22px] font-bold leading-tight">{berikutnya.judul}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {berikutnya.kata_target.map((k) => (
              <span key={k} className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                {k}
              </span>
            ))}
          </div>
          <p className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold">
            Buka kartu <Ikon nama="panah-kanan" ukuran={18} />
          </p>
        </Link>
      ) : semuaSelesai ? (
        <section className="rounded-3xl bg-hijau-muda p-5">
          <p className="text-[20px] font-bold text-hijau-tua">Semua aktivitas hari ini selesai</p>
          <p className="mt-1 text-[16px] text-hijau-tua/90">
            Terima kasih sudah meluangkan waktu untuk {data.anak.nama} hari ini.
          </p>
        </section>
      ) : null}

      {lain.length > 0 ? (
        <section className="space-y-2">
          <h2 className={g.labelSeksi}>Aktivitas lain</h2>
          <ul className={g.daftar}>
            {lain.map((a) => (
              <li key={a.item_id}>
                <Link href={`/aktivitas/${a.item_id}`} className={`${g.barisDaftar} tekan`}>
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      a.selesai_hari_ini ? "bg-hijau text-white" : "ring-2 ring-inset ring-garis"
                    }`}
                  >
                    {a.selesai_hari_ini ? <Ikon nama="centang" ukuran={16} /> : null}
                    <span className="sr-only">{a.selesai_hari_ini ? "Selesai" : "Belum"}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-semibold ${a.selesai_hari_ini ? "text-abu" : ""}`}>{a.judul}</span>
                    <span className="block text-[14px] text-abu">{a.rutinitas}</span>
                  </span>
                  <Ikon nama="panah-kanan" ukuran={18} className="text-abu" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.anggota.izin_nilai ? (
        <Link href={berikutnya ? `/rekam?item=${berikutnya.item_id}` : "/rekam"} className={g.tombolUtama}>
          <Ikon nama="mikrofon" /> Rekam 1 Menit
        </Link>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        {PINTASAN.map((p) => (
          <Link key={p.href} href={p.href} className={`${g.kartu} tekan flex min-h-[92px] flex-col justify-between`}>
            <Ikon nama={p.ikon} className="text-hijau-tua" />
            <span className="text-[15px] font-semibold leading-tight">{p.label}</span>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <p className="px-1 text-[15px] text-abu">
          Minggu ini Anda aktif <span className="font-semibold tabular-nums text-foreground">{data.hari_aktif_minggu_ini} hari</span>.
        </p>
        {data.anggota.pengelola && data.kabar_keluarga.length > 0 ? (
          <ul className={g.daftar}>
            {data.kabar_keluarga.map((k, i) => (
              <li key={i} className={g.barisDaftar}>
                <Inisial nama={k.nama} ukuran={32} />
                <span className="flex-1 text-[15px]">
                  <span className="font-semibold">{k.nama}</span> {k.isi}
                </span>
                <span className="text-[13px] tabular-nums text-abu">{k.waktu}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
