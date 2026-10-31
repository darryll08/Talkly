"use client";

import Link from "next/link";
import { Suspense } from "react";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { StatusAnak } from "@/components/terapis/status-anak";
import * as g from "@/lib/gaya";

function MingguIni() {
  const { data, galat, muatUlang } = useData(API.mingguIni, undefined, { masuk: "/terapis/masuk" });
  if (galat) return <div role="alert" className={g.kotakGalat}><p>{galat}</p><button className={g.tombolTeks} onClick={muatUlang}>Coba lagi</button></div>;
  if (!data) return <Memuat label="Memuat sesi minggu ini" />;
  return (
    <div className="muncul space-y-8">
      <header className="space-y-2"><p className={g.labelAtas}>Selamat datang, {data.terapis.nama}</p><h1 className={g.judulHalaman}>Minggu ini</h1><p className="text-abu">Persiapan sesi tiga hari ke depan.</p></header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{([
        ["Anak", data.ringkasan.total], ["Bahas minggu ini", data.ringkasan.bahas], ["Perlu ditinjau", data.ringkasan.meninjau], ["Lanjut", data.ringkasan.lanjut],
      ] as const).map(([judul, jumlah]) => <div key={judul} className={g.kartu}><p className="text-sm text-abu">{judul}</p><p className={`mt-2 text-3xl ${g.angkaBesar} ${judul === "Bahas minggu ini" ? "text-oranye-tua" : "text-hijau-tua"}`}>{jumlah}</p></div>)}</div>
      <Link href="/terapis/anak/baru" className={g.tombolTeks}>+ Tambah anak</Link>
      {data.ringkasan.total === 0 && <p className={g.kartu}>Belum ada anak. Tambahkan program anak pertama untuk memulai.</p>}
      {data.hari.map((hari) => <section key={hari.tanggal} className="space-y-3"><h2 className={g.labelSeksi}>{hari.nama_hari} · {new Date(`${hari.tanggal}T12:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", timeZone: "Asia/Jakarta" })}</h2>{!hari.anak.length ? <p className={`${g.kartu} text-abu`}>Tidak ada sesi.</p> : <ul className={g.daftar}>{hari.anak.map((anak) => <li key={anak.id}><Link href={`/terapis/anak/${anak.id}`} className={`${g.barisDaftar} tekan flex-wrap hover:bg-background`}><time className="text-sm font-semibold tabular-nums">{anak.jam_sesi}</time><Inisial nama={anak.nama} /><div className="min-w-0 flex-1 basis-40"><p className="break-words font-semibold">{anak.nama}</p><p className="text-sm text-abu">{anak.usia_bulan} bln · tahap {anak.tahap} · aktif {anak.hari_aktif_7}/7</p>{anak.data_contoh && <p className="text-xs text-abu">Data contoh</p>}</div><div className="w-full sm:w-64"><StatusAnak status={anak.status} pemicu={anak.pemicu} /></div></Link></li>)}</ul>}</section>)}
    </div>
  );
}
export default function HalamanMingguIni() { return <Suspense fallback={<Memuat />}><MingguIni /></Suspense>; }
