"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParamRute } from "@/lib/perangkat/param";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { daftarKartuBenda, kataKartu, pilihKartuUntuk, type KartuBenda } from "@/lib/perangkat/klip";
import { useSaya } from "@/lib/perangkat/saya";
import { Memuat } from "@/components/memuat";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { KepalaHijau } from "@/components/kepala-hijau";
import { Ikon } from "@/components/ikon";

// O4 Kartu aktivitas: terbaca dalam sekitar 15 detik.
export function KartuAktivitas() {
  const itemId = useParamRute("itemId") ?? "";
  const { data, galat } = useData(API.aktivitasLihat, { itemId }, { aktif: Boolean(itemId) });
  const { data: saya } = useSaya();
  const [tercatat, setTercatat] = useState(false);
  const [kirim, setKirim] = useState(false);
  const [galatTulis, setGalatTulis] = useState<string | null>(null);
  const [fotoBenda, setFotoBenda] = useState<{ kartu: KartuBenda; url: string } | null>(null);

  // Foto benda milik keluarga untuk kata target, bila ada di ponsel ini.
  const kata = data?.kata_target.join("|") ?? "";
  useEffect(() => {
    if (!kata) return;
    let url: string | null = null;
    let batal = false;
    daftarKartuBenda().then((d) => {
      const k = pilihKartuUntuk(d, kata.split("|"));
      if (!k || batal) return;
      url = URL.createObjectURL(k.foto);
      setFotoBenda({ kartu: k, url });
    });
    return () => {
      batal = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [kata]);

  async function sudah() {
    setKirim(true);
    setGalatTulis(null);
    try {
      await panggil(API.aktivitasSelesai, { itemId });
      setTercatat(true);
    } catch (e) {
      setGalatTulis(pesanDari(e));
    } finally {
      setKirim(false);
    }
  }

  if (galat && !data) {
    return (
      <>
        <KepalaHalaman />
        <div className={g.kotakGalat}>{galat}</div>
      </>
    );
  }
  if (!data) return <Memuat />;
  const selesai = tercatat || data.selesai_hari_ini;

  return (
    <div className="pb-4">
      <div className="muncul space-y-4">
        <KepalaHijau kembali="/hari-ini" atas={data.rutinitas} judul={data.judul} />

        <section className={`${g.tumpuk} text-center`}>
          <p className="text-[13px] font-bold text-hijau">Kata minggu ini</p>
          <p className="font-judul mt-1 text-[34px] font-extrabold leading-tight text-hijau-tua">{data.kata_target.join(" · ")}</p>
        </section>

        {fotoBenda ? (
          <Link href="/kartu-benda" className="tekan flex items-center gap-4 rounded-3xl bg-oranye-muda p-3 pr-4 ring-2 ring-oranye/40">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob lokal dari IndexedDB */}
            <img
              src={fotoBenda.url}
              alt={`Foto ${fotoBenda.kartu.nama_benda}`}
              className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-kartu"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[13px] font-bold text-oranye-tua">
                <Ikon nama="kamera" ukuran={14} /> Kartu foto benda
              </span>
              <span className="font-judul block text-[28px] font-extrabold leading-tight text-foreground">{kataKartu(fotoBenda.kartu)}</span>
              <span className="block text-[14px] leading-snug text-oranye-tua">
                Tunjukkan sambil menyebut &ldquo;{kataKartu(fotoBenda.kartu)}&rdquo;, lalu kembali ke benda aslinya.
              </span>
            </span>
          </Link>
        ) : (
          <Link
            href="/kartu-benda"
            className="tekan flex items-center gap-3 rounded-3xl border-2 border-dashed border-oranye/40 bg-permukaan p-4 text-oranye-tua"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-oranye-muda">
              <Ikon nama="kamera" ukuran={24} />
            </span>
            <span className="text-[15px] font-semibold leading-snug">
              Foto benda kesukaan anak untuk &ldquo;{data.kata_target[0]}&rdquo; agar muncul di sini
            </span>
          </Link>
        )}

        <ol className={g.daftar}>
          {data.langkah.map((l, i) => (
            <li key={i} className="flex gap-3 px-4 py-3.5">
              <span className="font-judul inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-oranye text-[15px] font-extrabold text-white">
                {i + 1}
              </span>
              <span className="text-[16px] leading-snug">{l}</span>
            </li>
          ))}
        </ol>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-oranye-muda p-4">
            <p className="text-[13px] font-semibold text-oranye-tua">Kalau anak mencoba</p>
            <p className="mt-1 text-[15px] leading-snug">{data.bila_mencoba}</p>
          </div>
          <div className="rounded-2xl bg-permukaan p-4 shadow-kartu">
            <p className="text-[13px] font-semibold text-abu">Kalau belum mau</p>
            <p className="mt-1 text-[15px] leading-snug">{data.bila_belum}</p>
          </div>
        </section>

        <div className="space-y-3 pt-2">
          {saya?.anggota.izin_nilai !== false ? (
            <Link
              href={`/rekam?item=${encodeURIComponent(itemId)}`}
              className="tekan flex items-center gap-4 rounded-3xl bg-hijau-tua p-4 pr-5 text-white shadow-angkat"
            >
              <span className={g.tombolRekam.replace("tekan ", "")}>
                <Ikon nama="mikrofon" ukuran={28} />
              </span>
              <span className="font-judul text-[22px] font-extrabold">Rekam 1 Menit</span>
            </Link>
          ) : null}
          {selesai ? (
            <p className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-permukaan text-[16px] font-semibold text-foreground ring-1 ring-garis" role="status">
              <Ikon nama="centang" ukuran={20} /> Tercatat untuk hari ini
            </p>
          ) : (
            <button type="button" onClick={sudah} disabled={kirim} className={g.tombolKedua}>
              {kirim ? "Mencatat…" : "Sudah, tanpa rekam"}
            </button>
          )}
          {galatTulis ? <p className={g.kotakGalat}>{galatTulis}</p> : null}
          <Link href="/hari-ini" className={`${g.tombolTeks} w-full justify-center`}>
            Ganti aktivitas
          </Link>
        </div>
      </div>
    </div>
  );
}
