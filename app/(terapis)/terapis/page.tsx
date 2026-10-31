"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { API, type ResponseDari } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { Ikon } from "@/components/ikon";
import { KepalaHijau } from "@/components/kepala-hijau";
import { StatusAnak } from "@/components/terapis/status-anak";
import * as g from "@/lib/gaya";

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
  return (
    <div className="muncul space-y-8">
      <KepalaHijau
        bentuk="panel"
        atas={`Selamat datang, ${data.terapis.nama}`}
        judul="Minggu ini"
        kanan={
          <Link
            href="/terapis/anak/baru"
            className="tekan inline-flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-oranye px-5 font-semibold text-foreground shadow-angkat"
          >
            <Ikon nama="tambah" ukuran={20} /> Tambah anak
          </Link>
        }
      >
        <p className="text-teks-di-hijau">Persiapan sesi tiga hari ke depan.</p>
      </KepalaHijau>
      <div className="relative z-10 mx-4 !mt-[-4rem] grid grid-cols-2 gap-3 sm:mx-6 sm:grid-cols-4">
        {(
          [
            ["Anak", data.ringkasan.total],
            ["Bahas minggu ini", data.ringkasan.bahas],
            ["Perlu ditinjau", data.ringkasan.meninjau],
            ["Lanjut", data.ringkasan.lanjut],
          ] as const
        ).map(([judul, jumlah]) => (
          <div key={judul} className="rounded-2xl bg-permukaan p-4 shadow-tumpuk">
            <p className="text-sm text-abu">{judul}</p>
            <p
              className={`mt-1 text-[40px] leading-none ${g.angkaBesar} ${judul === "Bahas minggu ini" ? "text-oranye-tua" : "text-hijau-tua"}`}
            >
              {jumlah}
            </p>
          </div>
        ))}
      </div>
      {data.ringkasan.total === 0 && (
        <p className={g.kartu}>
          Belum ada anak. Tambahkan program anak pertama untuk memulai.
        </p>
      )}
      {data.hari.map((hari) => (
        <section key={hari.tanggal} className="space-y-3">
          <h2 className={g.labelSeksi}>
            {hari.nama_hari} ·{" "}
            {new Date(`${hari.tanggal}T12:00:00+07:00`).toLocaleDateString(
              "id-ID",
              { day: "numeric", month: "long", timeZone: "Asia/Jakarta" },
            )}
          </h2>
          {!hari.anak.length ? (
            <p className={`${g.kartu} text-abu`}>Tidak ada sesi.</p>
          ) : (
            <ul className={g.daftar}>
              {hari.anak.map((anak) => (
                <li key={anak.id}>
                  <Link
                    href={`/terapis/anak/${anak.id}`}
                    className={`${g.barisDaftar} tekan flex-wrap hover:bg-background`}
                  >
                    <time className="text-sm font-semibold tabular-nums">
                      {anak.jam_sesi}
                    </time>
                    <Inisial nama={anak.nama} />
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="break-words font-semibold">{anak.nama}</p>
                      <p className="text-sm text-abu">
                        {anak.usia_bulan} bln · tahap {anak.tahap} · aktif{" "}
                        {anak.hari_aktif_7}/7
                      </p>
                      {anak.data_contoh && (
                        <p className="text-xs text-abu">Data contoh</p>
                      )}
                    </div>
                    <div className="w-full sm:w-64">
                      <StatusAnak status={anak.status} pemicu={anak.pemicu} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {data.semua.length > 0 && <SemuaAnak anak={data.semua} />}
    </div>
  );
}

const HARI_PENDEK = ["", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Semua anak yang ditangani, supaya anak baru atau yang sesinya di luar tiga hari ke depan tetap bisa dibuka. */
function SemuaAnak({ anak }: { anak: ResponseDari<"mingguIni">["semua"] }) {
  const [cari, setCari] = useState("");
  const tampil = anak.filter((a) => a.nama.toLowerCase().includes(cari.trim().toLowerCase()));
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className={g.labelSeksi}>Semua anak · {anak.length}</h2>
        <input
          className={`${g.isian} w-full py-2 sm:w-64`}
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari nama anak"
          aria-label="Cari nama anak"
        />
      </div>
      <ul className={g.daftar}>
        {tampil.map((a) => (
          <li key={a.id}>
            <Link href={`/terapis/anak/${a.id}`} className={`${g.barisDaftar} tekan flex-wrap hover:bg-background`}>
              <span className="w-16 text-sm font-semibold tabular-nums">
                {a.hari_sesi ? `${HARI_PENDEK[a.hari_sesi]} ${a.jam_sesi}` : "–"}
              </span>
              <Inisial nama={a.nama} />
              <div className="min-w-0 flex-1 basis-40">
                <p className="break-words font-semibold">{a.nama}</p>
                <p className="text-sm text-abu">
                  {a.usia_bulan} bln · tahap {a.tahap} · aktif {a.hari_aktif_7}/7
                  {a.hari_sesi ? "" : " · sesi belum dijadwalkan"}
                </p>
              </div>
              <div className="w-full sm:w-64">
                <StatusAnak status={a.status} pemicu={a.pemicu} />
              </div>
            </Link>
          </li>
        ))}
        {!tampil.length && <li className={`${g.barisDaftar} text-abu`}>Tidak ada anak dengan nama itu.</li>}
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
