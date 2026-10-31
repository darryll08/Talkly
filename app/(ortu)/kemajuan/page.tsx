"use client";

import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";

const angka = (x: number) => x.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const bulat = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 1 });
const tanggal = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

// O10 Kemajuan: cara orang tua (terukur, hijau) dan kata anak (dilaporkan, oranye). Tanpa perbandingan dengan anak lain.
export default function Kemajuan() {
  const { data, galat } = useData(API.kemajuan);
  if (galat && !data) return <div className={`${g.kotakGalat} mt-6`}>{galat}</div>;
  if (!data) return <Memuat />;

  const { strategi, tren } = data;
  const terisi = tren.filter((t) => t.jeda_rata_s !== null);
  const awal = terisi[0]?.jeda_rata_s ?? null;
  const maks = Math.max(5, ...terisi.map((t) => t.jeda_rata_s ?? 0));

  return (
    <div className="muncul space-y-5 pt-6">
      <header className="space-y-1">
        <p className={g.labelAtas}>Latihan {data.anak.nama}</p>
        <h1 className={g.judulHalaman}>Kemajuan</h1>
      </header>

      <section className={`${g.kartu} space-y-4`}>
        <p className="text-[13px] font-semibold text-hijau-tua">Dari rekaman Anda · terukur</p>
        {strategi.data_cukup && strategi.jeda_rata_s.nilai !== null ? (
          <>
            <div>
              <p className="text-[15px] text-abu">Rata-rata jeda menunggu minggu ini</p>
              <p className={`${g.angkaBesar} text-[48px] leading-tight text-hijau-tua`}>
                {angka(strategi.jeda_rata_s.nilai)}
                <span className="ml-1 text-[20px] font-semibold">detik</span>
              </p>
              {awal !== null && terisi.length > 1 ? (
                <p className="text-[15px] text-abu">naik dari {angka(awal)} detik</p>
              ) : null}
            </div>

            {terisi.length > 0 ? (
              <figure aria-label="Jeda menunggu per minggu">
                <div className="flex h-36 items-end gap-3">
                  {tren.map((t, i) => {
                    const terakhir = i === tren.length - 1;
                    const tinggi = t.jeda_rata_s ? (t.jeda_rata_s / maks) * 100 : 0;
                    return (
                      <div key={t.minggu_mulai} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className={`text-[13px] font-semibold tabular-nums ${terakhir ? "text-hijau-tua" : "text-abu"}`}>
                          {t.jeda_rata_s !== null ? angka(t.jeda_rata_s) : "–"}
                        </span>
                        <div
                          className={`w-full max-w-14 rounded-t-lg ${terakhir ? "bg-hijau" : "bg-hijau/30"}`}
                          style={{ height: `${Math.max(tinggi, 2)}%` }}
                        />
                        <span className="text-[12px] text-abu">{tanggal(t.minggu_mulai)}</span>
                      </div>
                    );
                  })}
                </div>
                <figcaption className="mt-2 text-[13px] text-abu">Jeda menunggu (detik) per minggu. Target sedikitnya 3 detik.</figcaption>
              </figure>
            ) : null}

            {strategi.giliran_per_menit.nilai !== null ? (
              <div className="flex items-baseline justify-between border-t border-garis pt-3">
                <span className="text-[15px]">Giliran percakapan</span>
                <span className="text-[17px] font-bold tabular-nums text-hijau-tua">
                  {bulat(strategi.giliran_per_menit.nilai)} per menit
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-[16px] leading-snug">
            Angka lengkap muncul setelah ada sedikitnya 3 rekaman dan 30 ajakan dalam 14 hari. Sekarang:{" "}
            <span className="font-semibold tabular-nums">
              {strategi.rekaman} rekaman, {strategi.ajakan} ajakan
            </span>
            .
          </p>
        )}
      </section>

      <section className="rounded-2xl bg-oranye-muda p-4">
        <p className="text-[13px] font-semibold text-oranye-tua">Kata {data.anak.nama} · dilaporkan keluarga</p>
        {data.kata_anak.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.kata_anak.map((k) => (
              <li
                key={k.kata}
                title={`Sejak ${tanggal(k.sejak)}`}
                className={`inline-flex items-center gap-1 rounded-full bg-permukaan px-3 py-1 text-[15px] font-semibold ${
                  k.sumber === "dikonfirmasi_terapis" ? "text-foreground" : "text-oranye-tua ring-1 ring-inset ring-oranye"
                }`}
              >
                {k.sumber === "dikonfirmasi_terapis" ? <span aria-label="dikonfirmasi terapis">✓</span> : null}
                {k.kata}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[15px]">Belum ada kata yang dicatat. Isi Catatan malam saat {data.anak.nama} mengucapkan sesuatu.</p>
        )}
        <p className="mt-3 text-[13px] leading-snug text-oranye-tua/90">
          Bergaris oranye = dilaporkan keluarga. ✓ = sudah dikonfirmasi terapis saat sesi.
        </p>
      </section>
    </div>
  );
}
