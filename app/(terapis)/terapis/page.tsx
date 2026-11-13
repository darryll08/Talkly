"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { API, type ResponseDari } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { Ikon } from "@/components/ikon";
import { StatusAnak } from "@/components/terapis/status-anak";
import * as g from "@/lib/gaya";

type Data = ResponseDari<"mingguIni">;
type AnakSesi = Data["hari"][number]["anak"][number];

const tanggalPanjang = (t: string) =>
  new Date(`${t}T12:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", timeZone: "Asia/Jakarta" });
const tanggalAngka = (t: string) => new Date(`${t}T12:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", timeZone: "Asia/Jakarta" });

function MingguIni() {
  const { data, galat, muatUlang } = useData(API.mingguIni, undefined, {
    masuk: "/terapis/masuk",
  });
  if (galat)
    return (
      <div role="alert" className={g.kotakGalat}>
        <p>{galat}</p>
        <button className={g.tombolTeks} onClick={muatUlang}>
          Coba lagi
        </button>
      </div>
    );
  if (!data) return <Memuat label="Memuat sesi minggu ini" />;

  const r = data.ringkasan;
  return (
    <div className="muncul space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[15px] font-medium text-abu">Selamat datang, {data.terapis.nama}</p>
          <h1 className="text-[36px] font-extrabold sm:text-[42px]">Minggu ini</h1>
          <p className="text-[15px] text-abu">Persiapan sesi tiga hari ke depan, terurut dari yang paling perlu dibahas.</p>
        </div>
        <Link
          href="/terapis/anak/baru"
          className="tekan inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-hijau-tua px-6 font-semibold text-white shadow-angkat"
        >
          <Ikon nama="tambah" ukuran={20} /> Tambah anak
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Ringkasan status anak">
        <KartuAngka utama judul="Anak ditangani" jumlah={r.total} keterangan="Semua program aktif" />
        <KartuAngka judul="Bahas minggu ini" jumlah={r.bahas} keterangan="Dari laporan keluarga" nada="oranye" />
        <KartuAngka judul="Perlu ditinjau" jumlah={r.meninjau} keterangan="Dinaikkan aturan otomatis" />
        <KartuAngka judul="Lanjut" jumlah={r.lanjut} keterangan="Program berjalan" />
      </section>

      {r.total === 0 ? <p className={g.kartu}>Belum ada anak. Tambahkan program anak pertama untuk memulai.</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <JadwalSesi hari={data.hari} />
        <div className="space-y-6">
          <PerluPerhatian anak={data.semua} />
          <KeaktifanKeluarga anak={data.semua} />
        </div>
      </div>

      {data.semua.length > 0 && <SemuaAnak anak={data.semua} />}
    </div>
  );
}

/** Kartu angka ala dasbor: kartu pertama hijau tua, sisanya putih. Tidak bisa diklik, jadi tanpa ikon panah. */
function KartuAngka({
  judul,
  jumlah,
  keterangan,
  utama = false,
  nada = "hijau",
}: {
  judul: string;
  jumlah: number;
  keterangan: string;
  utama?: boolean;
  nada?: "hijau" | "oranye";
}) {
  return (
    <div
      className={`kepala-hijau relative isolate overflow-hidden rounded-3xl p-5 ${
        utama ? "bg-hijau-tua text-white shadow-tumpuk" : "bg-permukaan shadow-kartu before:hidden after:hidden"
      }`}
    >
      <div className="relative z-10">
        <p className={`text-[15px] font-semibold ${utama ? "text-white" : "text-foreground"}`}>{judul}</p>
        <p
          className={`${g.angkaBesar} mt-3 text-[48px] leading-none ${
            utama ? "text-white" : nada === "oranye" ? "text-oranye-tua" : "text-foreground"
          }`}
        >
          {jumlah}
        </p>
        <p className={`mt-2 text-[13px] ${utama ? "text-teks-di-hijau" : "text-abu"}`}>{keterangan}</p>
      </div>
    </div>
  );
}

/** Tiga hari ke depan sebagai pil tanggal (seperti kalender di aplikasi kesehatan), daftar sesi di bawahnya. */
function JadwalSesi({ hari }: { hari: Data["hari"] }) {
  const [pilih, setPilih] = useState(0);
  const h = hari[pilih];
  if (!h) return null;
  return (
    <section className={`${g.kartu} space-y-5 rounded-3xl p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="judul text-[22px] font-extrabold">Sesi tiga hari ke depan</h2>
          <p className="text-[14px] text-abu">
            {h.nama_hari}, {tanggalPanjang(h.tanggal)} · {h.anak.length} sesi
          </p>
        </div>
        <div role="tablist" aria-label="Pilih hari" className="flex gap-2">
          {hari.map((x, i) => (
            <button
              key={x.tanggal}
              type="button"
              role="tab"
              aria-selected={i === pilih}
              onClick={() => setPilih(i)}
              className={`tekan flex w-[72px] flex-col items-center rounded-2xl py-2 ${
                i === pilih ? "bg-hijau-tua text-white shadow-angkat" : "bg-background text-foreground ring-1 ring-garis"
              }`}
            >
              <span className={`text-[13px] ${i === pilih ? "text-teks-di-hijau" : "text-abu"}`}>{x.nama_hari.slice(0, 3)}</span>
              <span className="text-[20px] font-bold tabular-nums leading-tight">{tanggalAngka(x.tanggal)}</span>
              <span className={`text-[13px] ${i === pilih ? "text-teks-di-hijau" : "text-abu"}`}>{x.anak.length} sesi</span>
            </button>
          ))}
        </div>
      </div>

      {!h.anak.length ? (
        <p className="garis-miring rounded-2xl px-4 py-8 text-center text-[15px] text-abu">Tidak ada sesi di hari ini.</p>
      ) : (
        <ul className="space-y-2">
          {h.anak.map((anak) => (
            <BarisAnak key={anak.id} anak={anak} kiri={<time className="w-12 text-[15px] font-bold tabular-nums">{anak.jam_sesi}</time>} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BarisAnak({ anak, kiri }: { anak: AnakSesi; kiri?: React.ReactNode }) {
  return (
    <li>
      <Link
        href={`/terapis/anak/${anak.id}`}
        className="tekan flex flex-wrap items-center gap-3 rounded-2xl bg-background px-4 py-3 hover:bg-hijau-muda/60"
      >
        {kiri}
        <Inisial nama={anak.nama} nada={anak.status === "bahas_minggu_ini" ? "oranye" : "hijau"} />
        <div className="min-w-0 flex-1 basis-36">
          <p className="break-words font-semibold">{anak.nama}</p>
          <p className="text-sm text-abu">
            {anak.usia_bulan} bln · tahap {anak.tahap} · aktif {anak.hari_aktif_7}/7
            {anak.data_contoh ? " · data contoh" : ""}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <StatusAnak status={anak.status} pemicu={anak.pemicu} />
        </div>
      </Link>
    </li>
  );
}

function PerluPerhatian({ anak }: { anak: Data["semua"] }) {
  const daftar = anak.filter((a) => a.status !== "lanjut");
  return (
    <section className={`${g.kartu} space-y-4 rounded-3xl p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="judul text-[20px] font-extrabold">Perlu perhatian</h2>
        <span className="rounded-full bg-oranye-muda px-2.5 py-0.5 text-[13px] font-bold text-oranye-tua">{daftar.length}</span>
      </div>
      {daftar.length ? (
        <ul className="space-y-3">
          {daftar.slice(0, 5).map((a) => (
            <li key={a.id}>
              <Link href={`/terapis/anak/${a.id}`} className="tekan flex items-start gap-3 rounded-xl hover:bg-background">
                <span
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full ${a.status === "bahas_minggu_ini" ? "bg-oranye" : "bg-hijau-lembut"}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{a.nama}</span>
                  <span className="block text-[13px] leading-snug text-abu">{a.pemicu ?? "Perlu ditinjau"}</span>
                </span>
                <Ikon nama="panah-kanan" ukuran={18} className="mt-1 text-abu" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] text-abu">Semua anak berstatus Lanjut.</p>
      )}
    </section>
  );
}

/** Setengah lingkaran: berapa anak yang keluarganya aktif ≥ 3 hari dalam 7 hari terakhir. */
function KeaktifanKeluarga({ anak }: { anak: Data["semua"] }) {
  if (!anak.length) return null;
  const aktif = anak.filter((a) => a.hari_aktif_7 >= 3).length;
  const kadang = anak.filter((a) => a.hari_aktif_7 > 0 && a.hari_aktif_7 < 3).length;
  const diam = anak.length - aktif - kadang;
  const persen = Math.round((aktif / anak.length) * 100);
  const panjang = Math.PI * 80;
  const bagian = (n: number) => (n / anak.length) * panjang;

  return (
    <section className={`${g.kartu} space-y-3 rounded-3xl p-5`}>
      <h2 className="judul text-[20px] font-extrabold">Keaktifan keluarga</h2>
      <figure className="relative mx-auto w-full max-w-[240px]">
        <svg viewBox="0 0 200 110" className="w-full" aria-hidden="true">
          <path d="M20 100a80 80 0 0 1 160 0" fill="none" stroke="var(--abu-muda)" strokeWidth="22" strokeLinecap="round" />
          <path
            d="M20 100a80 80 0 0 1 160 0"
            fill="none"
            stroke="var(--hijau-lembut)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={`${bagian(aktif) + bagian(kadang)} ${panjang}`}
          />
          <path
            d="M20 100a80 80 0 0 1 160 0"
            fill="none"
            stroke="var(--hijau-tua)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={`${bagian(aktif)} ${panjang}`}
          />
        </svg>
        <figcaption className="absolute inset-x-0 bottom-0 text-center">
          <span className={`${g.angkaBesar} block text-[36px] leading-none`}>{persen}%</span>
          <span className="text-[13px] text-abu">aktif ≥ 3 hari</span>
        </figcaption>
      </figure>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-abu">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-hijau-tua" /> ≥ 3 hari · {aktif}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-hijau-lembut" /> 1–2 hari · {kadang}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-abu-muda ring-1 ring-garis" /> belum · {diam}
        </li>
      </ul>
    </section>
  );
}

const HARI_PENDEK = ["", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Semua anak yang ditangani, supaya anak baru atau yang sesinya di luar tiga hari ke depan tetap bisa dibuka. */
function SemuaAnak({ anak }: { anak: Data["semua"] }) {
  const [cari, setCari] = useState("");
  const tampil = anak.filter((a) => a.nama.toLowerCase().includes(cari.trim().toLowerCase()));
  return (
    <section className={`${g.kartu} space-y-4 rounded-3xl p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="judul text-[22px] font-extrabold">
          Semua anak <span className="font-sans text-[16px] font-semibold text-abu">· {anak.length}</span>
        </h2>
        <label className="relative w-full sm:w-72">
          <Ikon nama="cari" ukuran={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-abu" />
          <input
            className={`${g.isian} rounded-full bg-background py-2.5 pl-11`}
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama anak"
            aria-label="Cari nama anak"
          />
        </label>
      </div>
      <ul className="space-y-2">
        {tampil.map((a) => (
          <BarisAnak
            key={a.id}
            anak={a}
            kiri={
              <span className="w-16 text-sm font-semibold tabular-nums">
                {a.hari_sesi ? `${HARI_PENDEK[a.hari_sesi]} ${a.jam_sesi}` : <span className="font-normal text-abu">Tanpa jadwal</span>}
              </span>
            }
          />
        ))}
        {!tampil.length && <li className="px-4 py-3 text-abu">Tidak ada anak dengan nama itu.</li>}
      </ul>
    </section>
  );
}

export default function HalamanMingguIni() {
  return (
    <Suspense fallback={<Memuat />}>
      <MingguIni />
    </Suspense>
  );
}
