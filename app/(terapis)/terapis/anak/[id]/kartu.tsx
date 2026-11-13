"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { API, type ResponseDari } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { StatusAnak } from "@/components/terapis/status-anak";
import { PitaPercakapan } from "@/components/terapis/pita-percakapan";
import { AudioRekaman } from "@/components/terapis/audio-rekaman";
import * as g from "@/lib/gaya";
import { Ikon } from "@/components/ikon";

type Kartu = ResponseDari<"anakKartu">;
type Rentang = Kartu["strategi"]["jeda_rata_s"];
const nombre = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n));
const tanggalPendek = (t: string) => new Date(`${t}T12:00:00+07:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
const STATUS_REKAMAN: Record<string, string> = { antre: "Sedang dinilai", dinilai: "Dinilai", ditolak: "Tidak dinilai" };

/** Kartu bagian kartu anak: judul seksi + isi, seragam dengan dasbor. */
function Panel({ judul, kanan, children, className = "" }: { judul: string; kanan?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`space-y-4 rounded-3xl bg-permukaan p-5 shadow-kartu ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="judul text-[20px] font-extrabold">{judul}</h2>
        {kanan}
      </div>
      {children}
    </section>
  );
}

function Ukuran({ judul, nilai, unit, utama = false }: { judul: string; nilai: Rentang; unit: string; utama?: boolean }) {
  return (
    <div
      className={`kepala-hijau relative isolate overflow-hidden rounded-3xl p-5 ${
        utama ? "bg-hijau-tua text-white shadow-tumpuk" : "bg-permukaan shadow-kartu before:hidden after:hidden"
      }`}
    >
      <div className="relative z-10">
        <p className={`text-[15px] font-semibold ${utama ? "text-white" : ""}`}>{judul}</p>
        <p className={`${g.angkaBesar} mt-3 text-[40px] leading-none ${utama ? "text-white" : "text-hijau-tua"}`}>
          {nombre(nilai.nilai)} <span className="font-sans text-[15px] font-semibold">{unit}</span>
        </p>
        <p className={`mt-2 text-[13px] ${utama ? "text-teks-di-hijau" : "text-abu"}`}>
          Rentang {nombre(nilai.bawah)}–{nombre(nilai.atas)} {unit}
        </p>
      </div>
    </div>
  );
}

/** Tren jeda per minggu sebagai grafik pil (lintasan bergaris miring), giliran dan vokalisasi di bawah tiap minggu. */
function TrenPil({ tren }: { tren: Kartu["tren"] }) {
  const maks = Math.max(5, ...tren.map((t) => t.jeda_rata_s ?? 0)) * 1.15;
  return (
    <div className="space-y-3">
      <div className="flex h-40 items-stretch gap-3 pt-8">
        {tren.map((t, i) => {
          const terakhir = i === tren.length - 1;
          return (
            <div key={t.minggu_mulai} className="flex flex-1 justify-center">
              <div className="garis-miring relative flex w-full max-w-14 items-end rounded-full">
                {t.jeda_rata_s !== null ? (
                  <div
                    className={`relative w-full rounded-full ${terakhir ? "bg-hijau-tua" : "bg-hijau-lembut"}`}
                    style={{ height: `${Math.max(8, (t.jeda_rata_s / maks) * 100)}%` }}
                  >
                    <span className="absolute inset-x-0 top-2 mx-auto block size-2.5 rounded-full bg-white/90" aria-hidden="true" />
                    <span
                      className={`absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold tabular-nums ${
                        terakhir ? "bg-foreground text-white" : "text-abu"
                      }`}
                    >
                      {nombre(t.jeda_rata_s)} dtk
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <ul className="flex gap-3 text-center text-[12px] text-abu">
        {tren.map((t) => (
          <li key={t.minggu_mulai} className="flex-1 space-y-0.5">
            <span className="block font-semibold text-foreground">{tanggalPendek(t.minggu_mulai)}</span>
            <span className="block">giliran {nombre(t.giliran_per_menit)}/mnt</span>
            <span className="block">
              {t.vokalisasi_per_minggu} vokal · {t.rekaman} rek
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Blok pertama kartu anak: kenapa anak ini perlu perhatian, apa yang dilakukan di sesi, dan kutipan regresi bila ada.
 * Angka strategi menyusul di bawahnya, karena tujuan D4 adalah persiapan sesi dalam tiga menit.
 */
function PerluDibahas({ data }: { data: Kartu }) {
  const bahas = data.anak.status === "bahas_minggu_ini";
  return (
    <section className={`space-y-4 rounded-3xl p-5 sm:p-6 ${bahas ? "bg-oranye-muda" : "bg-permukaan shadow-kartu"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="judul text-[22px] font-extrabold">Yang perlu dibahas</h2>
          <p className={`text-[17px] font-semibold leading-snug ${bahas ? "text-oranye-tua" : ""}`}>
            {data.anak.pemicu ?? "Tidak ada pemicu status. Program bisa dilanjutkan."}
          </p>
        </div>
        <StatusAnak status={data.anak.status} />
      </div>

      {data.kutipan_regresi.map((k, i) => (
        <blockquote key={i} className="rounded-2xl bg-permukaan p-4 text-[16px] leading-snug">
          “{k.kutipan}”
          <footer className="mt-1 text-[13px] text-oranye-tua">
            {k.nama} · {k.tanggal} · dilaporkan keluarga
          </footer>
        </blockquote>
      ))}

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-abu">Saran sesi dari aturan</p>
        {data.saran_sesi.length ? (
          <ol className="space-y-2">
            {data.saran_sesi.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-hijau-muda text-[13px] font-bold text-hijau-tua">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[15px] text-abu">Belum ada saran sesi.</p>
        )}
      </div>
    </section>
  );
}

export function KartuAnak() {
  const { id } = useParams<{ id: string }>();
  const { data, galat, status, muatUlang } = useData(API.anakKartu, { id }, { masuk: "/terapis/masuk" });
  if (galat)
    return (
      <div role="alert" className={g.kotakGalat}>
        <p>{status === 403 ? "Anak ini tidak ditangani oleh Anda." : galat}</p>
        <button className={g.tombolTeks} onClick={muatUlang}>
          Coba lagi
        </button>
      </div>
    );
  if (!data) return <Memuat label="Memuat kartu anak" />;
  if (data.anak.id !== id)
    return <p className={g.kotakGalat}>Kartu anak ini belum tersedia pada penyedia data. Data anak lain tidak ditampilkan.</p>;

  return (
    <article className="muncul space-y-6">
      <header className="flex flex-wrap items-center gap-5 rounded-3xl bg-permukaan p-5 shadow-kartu sm:p-6">
        <Inisial nama={data.anak.nama} ukuran={72} nada="oranye" />
        <div className="min-w-0 flex-1 basis-48 space-y-1">
          <p className="text-[14px] font-medium text-abu">Kartu anak · persiapan sesi</p>
          <h1 className="break-words text-[34px] font-extrabold leading-none">{data.anak.nama}</h1>
          <p className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[14px] text-abu">
            <span>{data.anak.usia_bulan} bulan</span>
            <span>Tahap {data.anak.tahap}</span>
            {data.anak.data_contoh ? <span className="rounded-full bg-abu-muda px-2 text-[12px] font-semibold">Data contoh</span> : null}
          </p>
        </div>
        <div className="w-full">
          <p className="mb-2 text-[13px] font-semibold text-abu">Kata target</p>
          <ul className="flex flex-wrap gap-2">
            {data.anak.kata_target.map((k) => (
              <li key={k} className={g.labelKata}>
                {k}
              </li>
            ))}
          </ul>
        </div>
      </header>

      {data.anak.data_contoh && <p className="px-1 text-sm text-abu">Data contoh · bukan hasil pengguna atau uji akurasi</p>}

      <PerluDibahas data={data} />

      <section className="space-y-3">
        <h2 className={g.labelSeksi}>Strategi dari rekaman · 14 hari</h2>
        {data.strategi.data_cukup ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Ukuran utama judul="Jeda menunggu" nilai={data.strategi.jeda_rata_s} unit="detik" />
            <Ukuran judul="Ajakan berhasil" nilai={data.strategi.ajakan_berhasil_persen} unit="%" />
            <Ukuran judul="Giliran percakapan" nilai={data.strategi.giliran_per_menit} unit="/menit" />
          </div>
        ) : (
          <p className={`${g.kartu} garis-miring rounded-3xl`}>
            Angka lengkap muncul setelah ada sedikitnya 3 rekaman dan 30 ajakan dalam 14 hari.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {data.strategi.data_cukup && data.tren.length > 0 && (
            <Panel judul="Tren mingguan" kanan={<span className="text-[13px] text-abu">Jeda menunggu · data terukur</span>}>
              <TrenPil tren={data.tren} />
            </Panel>
          )}

          <Panel
            judul="Percakapan terpilih"
            kanan={
              data.rekaman_terpilih ? (
                <span className="text-[13px] text-abu">
                  {data.rekaman_terpilih.perekam} · {data.rekaman_terpilih.durasi_s} detik
                </span>
              ) : null
            }
          >
            {data.rekaman_terpilih ? (
              <PitaPercakapan rekaman={data.rekaman_terpilih} />
            ) : (
              <p className="text-abu">Belum ada rekaman yang dapat ditampilkan.</p>
            )}
          </Panel>

          <Panel judul="Rekaman terbaru">
            {data.rekaman_terbaru.length ? (
              <ul className="space-y-2">
                {data.rekaman_terbaru.map((r) => (
                  <li
                    key={r.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm ${
                      r.kurang_tepat ? "bg-oranye-muda" : "bg-background"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-permukaan text-hijau-tua">
                        <Ikon nama="mikrofon" ukuran={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{r.perekam}</p>
                        <time className="text-abu">{new Date(r.dibuat).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</time>
                      </div>
                    </div>
                    <span className="flex flex-wrap items-center justify-end gap-2">
                      {r.kurang_tepat && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-oranye-tua px-3 py-1 text-xs font-semibold text-white">
                          <Ikon nama="info" ukuran={14} /> Ditandai keluarga: kurang tepat
                        </span>
                      )}
                      {r.jeda_rata_s !== null ? <span className="font-semibold tabular-nums text-hijau-tua">Jeda {nombre(r.jeda_rata_s)} dtk</span> : null}
                      <span className="rounded-full bg-permukaan px-2.5 py-0.5 text-xs font-semibold ring-1 ring-garis">
                        {STATUS_REKAMAN[r.status] ?? r.status}
                      </span>
                    </span>
                    {r.bisa_didengar && (
                      <div className="w-full">
                        <AudioRekaman id={r.id} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-abu">Belum ada rekaman.</p>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel judul="Per pengasuh">
            <ul className="space-y-3">
              {data.per_pengasuh.map((p) => (
                <li key={p.anggota_id} className="flex flex-wrap items-center gap-3">
                  <Inisial nama={p.nama} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.nama}</p>
                    <p className="text-sm text-abu">
                      {p.rekaman} rekaman · aktif {p.hari_aktif_7}/7
                    </p>
                  </div>
                  <p className="text-right text-sm text-hijau-tua">
                    {p.rekaman < 3 || p.jeda_rata_s === null || p.giliran_per_menit === null ? (
                      <span className="text-abu">Data belum cukup</span>
                    ) : (
                      <>
                        <span className="block font-semibold">Jeda {nombre(p.jeda_rata_s)} dtk</span>
                        <span className="block">{nombre(p.giliran_per_menit)} giliran/menit</span>
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <section className="space-y-4 rounded-3xl bg-oranye-muda p-5 text-oranye-tua">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-permukaan">
                <Ikon nama="pena" ukuran={20} />
              </span>
              <div>
                <h2 className="judul text-[20px] font-extrabold text-foreground">Dilaporkan keluarga</h2>
                <p className="text-[13px]">Terpisah dari pengukuran rekaman.</p>
              </div>
            </div>
            {data.laporan_keluarga.length ? (
              data.laporan_keluarga.map((l) => (
                <div key={l.id} className="rounded-2xl bg-permukaan/70 p-3 text-foreground">
                  <p className="text-sm font-semibold text-oranye-tua">
                    {l.nama} · {l.tanggal}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words">
                    {l.laporan.jenis === "catatan_malam" ? l.laporan.isi.catatan : l.laporan.isi.cerita}
                  </p>
                  {l.laporan.jenis === "catatan_malam" && (
                    <p className="mt-1 text-sm text-abu">Kondisi: {l.laporan.isi.kondisi.replaceAll("_", " ")}</p>
                  )}
                </div>
              ))
            ) : (
              <p>Belum ada laporan keluarga.</p>
            )}
            <div>
              <h3 className="text-sm font-semibold">Kata dilaporkan · belum dikonfirmasi terapis</h3>
              {data.kata_dilaporkan.length ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {data.kata_dilaporkan.map((k) => (
                    <li key={k.kata} className="inline-flex items-center gap-1 rounded-full bg-permukaan px-3 py-1 text-sm font-semibold text-foreground ring-2 ring-inset ring-oranye-tua">
                      <Ikon nama="pena" ukuran={13} className="text-oranye-tua" />
                      {k.kata}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Belum ada kata dilaporkan.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
