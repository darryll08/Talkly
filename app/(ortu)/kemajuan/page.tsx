"use client";

import * as g from "@/lib/gaya";
import { API, type ResponseDari } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { KepalaHijau } from "@/components/kepala-hijau";
import { Ikon, type NamaIkon } from "@/components/ikon";

const angka = (x: number) => x.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const bulat = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 1 });
const tanggal = (iso: string) => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

/** Target jeda dari terapis: hitung sampai lima, sedikitnya 3 detik. */
const TARGET_S = 3;
const SYARAT_REKAMAN = 3;
const SYARAT_AJAKAN = 30;

type Data = ResponseDari<"kemajuan">;

// O10 Kemajuan: cara orang tua (terukur, hijau) dan kata anak (dilaporkan, oranye). Tanpa skor dan tanpa perbandingan dengan anak lain.
export default function Kemajuan() {
  const { data, galat } = useData(API.kemajuan);
  if (galat && !data) return <div className={`${g.kotakGalat} mt-6`}>{galat}</div>;
  if (!data) return <Memuat />;

  const { strategi } = data;
  const cukup = strategi.data_cukup && strategi.jeda_rata_s.nilai !== null;

  return (
    <div className="muncul space-y-6 pb-4">
      <KepalaHijau atas={`Latihan ${data.anak.nama}`} judul="Kemajuan" />

      {cukup ? <JedaMingguan data={data} /> : <BelumCukup rekaman={strategi.rekaman} ajakan={strategi.ajakan} />}

      <section className="grid grid-cols-3 gap-3" aria-label="Ringkasan 14 hari">
        <Ubin
          ikon="pesan"
          nilai={strategi.giliran_per_menit.nilai !== null ? bulat(strategi.giliran_per_menit.nilai) : "–"}
          label="giliran / menit"
        />
        <Ubin ikon="mikrofon" nilai={String(strategi.rekaman)} label="rekaman" />
        <Ubin ikon="bintang" nilai={String(strategi.ajakan)} label="ajakan" />
      </section>
      <p className="-mt-3 px-1 text-[13px] text-abu">Dari rekaman 14 hari terakhir.</p>

      <KataAnak data={data} />
    </div>
  );
}

function Ubin({ ikon, nilai, label }: { ikon: NamaIkon; nilai: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-permukaan px-2 py-4 text-center shadow-kartu">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-hijau-muda text-hijau-tua">
        <Ikon nama={ikon} ukuran={19} />
      </span>
      <span className={`${g.angkaBesar} mt-2 text-[26px] leading-none text-foreground`}>{nilai}</span>
      <span className="mt-1 text-[13px] leading-tight text-abu">{label}</span>
    </div>
  );
}

/** Jeda menunggu per minggu sebagai grafik pil: lintasan bergaris miring, minggu ini hijau tua dengan label di atasnya. */
function JedaMingguan({ data }: { data: Data }) {
  const { strategi, tren } = data;
  const terisi = tren.filter((t) => t.jeda_rata_s !== null);
  const awal = terisi.length > 1 ? terisi[0].jeda_rata_s : null;
  const sekarang = strategi.jeda_rata_s.nilai!;
  const selisih = awal !== null ? Math.round((sekarang - awal) * 10) / 10 : null;
  const maks = Math.max(5, ...terisi.map((t) => t.jeda_rata_s ?? 0)) * 1.15;
  const posTarget = (TARGET_S / maks) * 100;

  return (
    <section className={`${g.tumpuk} space-y-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14px] text-abu">Jeda menunggu minggu ini</p>
          <p className={`${g.angkaBesar} text-[52px] leading-none text-hijau-tua`}>
            {angka(sekarang)}
            <span className="ml-1.5 font-sans text-[18px] font-semibold">detik</span>
          </p>
        </div>
        {selisih !== null && selisih !== 0 ? (
          <span className="mt-1 inline-flex shrink-0 items-center rounded-full bg-hijau-muda px-3 py-1 text-[14px] font-bold tabular-nums text-hijau-tua">
            {selisih > 0 ? "+" : "−"}
            {angka(Math.abs(selisih))} dtk
          </span>
        ) : null}
      </div>
      {awal !== null ? (
        <p className="-mt-3 text-[15px] text-abu">
          {selisih !== null && selisih > 0 ? "Naik" : "Berubah"} dari {angka(awal)} detik di minggu pertama.
        </p>
      ) : null}

      {terisi.length > 0 ? (
        <figure aria-label="Jeda menunggu per minggu" className="space-y-2">
          <div className="relative flex h-44 items-stretch gap-3 pt-9">
            <div
              className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-oranye/70"
              // Batang mengisi tinggi wadah dikurangi pt-9 (ruang label), jadi posisi target dihitung dari tinggi itu.
              style={{ bottom: `calc((100% - 2.25rem) * ${(posTarget / 100).toFixed(4)})` }}
              aria-hidden="true"
            />
            {tren.map((t, i) => {
              const terakhir = i === tren.length - 1;
              const tinggi = t.jeda_rata_s ? Math.max(8, (t.jeda_rata_s / maks) * 100) : 0;
              return (
                <div key={t.minggu_mulai} className="flex flex-1 justify-center">
                  <div className="garis-miring relative flex w-full max-w-12 items-end rounded-full">
                    {t.jeda_rata_s !== null ? (
                      <div
                        className={`relative w-full rounded-full ${terakhir ? "bg-hijau-tua" : "bg-hijau-lembut"}`}
                        style={{ height: `${tinggi}%` }}
                      >
                        <span className="absolute inset-x-0 top-2 mx-auto block size-2.5 rounded-full bg-white/90" aria-hidden="true" />
                        {terakhir ? (
                          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-2.5 py-1 text-[13px] font-semibold tabular-nums text-white">
                            {angka(t.jeda_rata_s)} dtk
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            {tren.map((t, i) => (
              <span
                key={t.minggu_mulai}
                className={`flex-1 text-center text-[12px] tabular-nums ${i === tren.length - 1 ? "font-semibold text-foreground" : "text-abu"}`}
              >
                {t.jeda_rata_s !== null && i !== tren.length - 1 ? `${angka(t.jeda_rata_s)} · ` : ""}
                {tanggal(t.minggu_mulai)}
              </span>
            ))}
          </div>
          <figcaption className="flex items-center gap-2 pt-1 text-[13px] text-abu">
            <span className="inline-block w-5 border-t-2 border-dashed border-oranye/70" aria-hidden="true" />
            Target sedikitnya {TARGET_S} detik: hitung sampai lima dalam hati.
          </figcaption>
        </figure>
      ) : null}
    </section>
  );
}

/** Sebelum angka cukup: dua bilah kemajuan menuju syarat, tanpa angka strategi yang belum bisa dipercaya. */
function BelumCukup({ rekaman, ajakan }: { rekaman: number; ajakan: number }) {
  const bilah = (label: string, n: number, syarat: number) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[15px]">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">
          {Math.min(n, syarat)} / {syarat}
        </span>
      </div>
      <div className="garis-miring h-3 overflow-hidden rounded-full">
        <div className="h-full rounded-full bg-hijau" style={{ width: `${Math.min(100, (n / syarat) * 100)}%` }} />
      </div>
    </div>
  );
  return (
    <section className={`${g.tumpuk} space-y-4`}>
      <div className="space-y-1">
        <p className="judul text-[20px] font-extrabold leading-tight">Angka jeda sedang dikumpulkan</p>
        <p className="text-[15px] leading-snug text-abu">Muncul setelah cukup rekaman dalam 14 hari, supaya angkanya bisa dipercaya.</p>
      </div>
      {bilah("Rekaman", rekaman, SYARAT_REKAMAN)}
      {bilah("Ajakan ke anak", ajakan, SYARAT_AJAKAN)}
    </section>
  );
}

function KataAnak({ data }: { data: Data }) {
  return (
    <section className="space-y-3 rounded-3xl bg-oranye-muda p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-permukaan text-oranye-tua">
          <Ikon nama="bintang" ukuran={20} />
        </span>
        <div className="min-w-0">
          <h2 className="judul text-[20px] font-extrabold leading-tight">Kata {data.anak.nama}</h2>
          <p className="text-[13px] font-medium text-oranye-tua">Dilaporkan keluarga · {data.kata_anak.length} kata</p>
        </div>
      </div>
      {data.kata_anak.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {data.kata_anak.map((k) => (
            <li
              key={k.kata}
              title={`Sejak ${tanggal(k.sejak)}`}
              className={`inline-flex items-center gap-1 rounded-full bg-permukaan px-3.5 py-1.5 text-[15px] font-semibold ${
                k.sumber === "dikonfirmasi_terapis" ? "text-foreground" : "text-foreground ring-2 ring-inset ring-oranye-tua"
              }`}
            >
              {k.sumber === "dikonfirmasi_terapis" ? (
                <Ikon nama="centang" ukuran={16} className="text-hijau" />
              ) : (
                <Ikon nama="pena" ukuran={14} className="text-oranye-tua" />
              )}
              {k.kata}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px]">Belum ada kata yang dicatat. Isi Catatan malam saat {data.anak.nama} mengucapkan sesuatu.</p>
      )}
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-snug text-oranye-tua">
        <span className="inline-flex items-center gap-1.5">
          <Ikon nama="pena" ukuran={14} /> dilaporkan keluarga
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Ikon nama="centang" ukuran={14} className="text-hijau" /> dikonfirmasi terapis
        </span>
      </p>
    </section>
  );
}
