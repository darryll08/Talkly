"use client";

import Link from "next/link";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { MenuAkun } from "@/components/menu-akun";
import { KepalaHijau } from "@/components/kepala-hijau";
import { Ikon, type NamaIkon } from "@/components/ikon";

function salam(jam: number) {
  if (jam < 11) return "Selamat pagi";
  if (jam < 15) return "Selamat siang";
  if (jam < 18) return "Selamat sore";
  return "Selamat malam";
}

const PINTASAN: { href: string; label: string; ikon: NamaIkon; nada: string }[] = [
  { href: "/catatan-malam", label: "Catatan malam", ikon: "bulan", nada: "text-foreground" },
  { href: "/ceritakan", label: "Ceritakan sendiri", ikon: "pena", nada: "text-foreground" },
  { href: "/kartu-benda", label: "Kartu foto benda", ikon: "kamera", nada: "text-foreground" },
  { href: "/pesan", label: "Pesan terapis", ikon: "pesan", nada: "text-foreground" },
];

// O3 Hari ini: cukup menjawab apa yang perlu dikerjakan hari ini. Tanpa skor.
export default function HariIni() {
  const { data, galat, dariCache } = useData(API.hariIni, undefined, { simpanLokal: "hari-ini" });

  if (galat && !data) return <div className={`${g.kotakGalat} mt-6`}>{galat}</div>;
  if (!data) return <Memuat />;

  const nama = data.anggota.nama.replace(/^(Ibu|Bu|Mbak|Bapak|Pak|Mas)\s+/i, "");
  const belum = data.aktivitas.filter((a) => !a.selesai_hari_ini);
  const berikutnya = belum[0];
  const lain = data.aktivitas.filter((a) => a !== berikutnya);
  const jumlahSelesai = data.aktivitas.length - belum.length;
  const semuaSelesai = data.aktivitas.length > 0 && belum.length === 0;
  const hrefRekam = berikutnya ? `/rekam?item=${berikutnya.item_id}` : "/rekam";

  return (
    <div className="muncul space-y-5">
      <KepalaHijau atas={`${salam(new Date().getHours())}, ${nama}`} judul={`Latihan ${data.anak.nama}`} kanan={<MenuAkun />}>
        {data.aktivitas.length > 0 ? (
          <div className="flex items-end gap-3" role="group" aria-label={`${jumlahSelesai} dari ${data.aktivitas.length} aktivitas hari ini`}>
            <p className="flex items-baseline gap-1.5">
              <span className={`${g.angkaBesar} text-[44px] leading-none`}>{jumlahSelesai}</span>
              <span className="text-[14px] text-teks-di-hijau">/ {data.aktivitas.length} aktivitas hari ini</span>
            </p>
            <div className="mb-2 flex flex-1 gap-1">
              {data.aktivitas.map((a, i) => (
                <span
                  key={a.item_id}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < jumlahSelesai ? "bg-oranye" : "bg-hijau-lembut"}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </KepalaHijau>

      {berikutnya ? (
        <Link href={`/aktivitas/${berikutnya.item_id}`} className={`${g.tumpuk} tekan block`}>
          <p className="text-[13px] font-bold text-hijau">Berikutnya · {berikutnya.rutinitas}</p>
          <p className="font-judul mt-0.5 text-[24px] font-extrabold leading-tight">{berikutnya.judul}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {berikutnya.kata_target.map((k) => (
              <span key={k} className={g.labelKata}>
                {k}
              </span>
            ))}
          </div>
          <p className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-hijau-tua">
            Buka kartu <Ikon nama="panah-kanan" ukuran={18} />
          </p>
        </Link>
      ) : semuaSelesai ? (
        <section className={g.tumpuk}>
          <p className="font-judul text-[22px] font-extrabold leading-tight">Semua aktivitas hari ini selesai</p>
          <p className="mt-1 text-[16px] text-abu">Terima kasih sudah meluangkan waktu untuk {data.anak.nama} hari ini.</p>
        </section>
      ) : (
        <section className={`${g.tumpuk} text-[16px] text-abu`}>{data.terapis.nama} belum mengirim rencana minggu ini.</section>
      )}

      {dariCache ? <p className={g.kotakGalat}>Belum tersambung. Ini data terakhir yang tersimpan di ponsel.</p> : null}

      {data.rencana ? (
        <section className="flex gap-3 rounded-2xl bg-oranye-muda p-4">
          <Inisial nama={data.terapis.nama} nada="oranye" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-oranye-tua">
              {data.rencana.baru ? `Rencana minggu baru dari ${data.terapis.nama}` : `Pesan ${data.terapis.nama}`}
            </p>
            <p className="mt-1 text-[16px] leading-snug">{data.rencana.pesan_keluarga}</p>
          </div>
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
                      a.selesai_hari_ini ? "centang-masuk bg-oranye text-white" : "ring-2 ring-inset ring-oranye"
                    }`}
                  >
                    {a.selesai_hari_ini ? <Ikon nama="centang" ukuran={16} /> : null}
                    <span className="sr-only">{a.selesai_hari_ini ? "Selesai" : "Belum"}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-semibold ${a.selesai_hari_ini ? "text-abu line-through decoration-oranye/60" : ""}`}>
                      {a.judul}
                    </span>
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
        <Link href={hrefRekam} className="tekan flex items-center gap-4 rounded-3xl bg-hijau-tua p-4 pr-5 text-white shadow-angkat">
          <span className={g.tombolRekam.replace("tekan ", "")}>
            <Ikon nama="mikrofon" ukuran={28} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-judul block text-[22px] font-extrabold leading-tight">Rekam 1 Menit</span>
            <span className="block text-[14px] text-teks-di-hijau">Taruh ponsel di meja, lalu bermain seperti biasa.</span>
          </span>
        </Link>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        {PINTASAN.map((p) => (
          <Link key={p.href} href={p.href} className={`${g.kartu} tekan flex min-h-[104px] flex-col justify-between`}>
            <span className={p.nada}>
              <Ikon nama={p.ikon} ukuran={22} />
            </span>
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
                <span className="flex-1 text-[15px]">{k.kalimat}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
