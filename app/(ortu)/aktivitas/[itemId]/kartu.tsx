"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import * as g from "@/lib/gaya";
import { api } from "@/lib/perangkat/sementara/api";
import { useData } from "@/lib/perangkat/use-data";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { daftarKartuBenda, type KartuBenda } from "@/lib/perangkat/klip";
import { useSaya } from "@/lib/perangkat/saya";
import { Memuat } from "@/components/memuat";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Ikon } from "@/components/ikon";

// O4 Kartu aktivitas: terbaca dalam sekitar 15 detik.
export function KartuAktivitas() {
  const itemId = decodeURIComponent(useParams<{ itemId: string }>().itemId);
  const { data, galat } = useData(api.aktivitas, { itemId });
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
      const k = d.find((x) => kata.split("|").includes(x.kata));
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
      await panggil(api.tandaiAktivitas, { itemId });
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
      <KepalaHalaman />
      <div className="muncul space-y-4">
        <header className="space-y-1">
          <p className={g.labelAtas}>{data.rutinitas}</p>
          <h1 className={g.judulHalaman}>{data.judul}</h1>
        </header>

        <section className="rounded-2xl bg-permukaan px-4 py-5 text-center shadow-kartu">
          <p className="text-[13px] font-medium text-abu">Kata minggu ini</p>
          <p className="mt-1 text-[32px] font-bold leading-tight text-hijau-tua">{data.kata_target.join(" · ")}</p>
          {fotoBenda ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob lokal dari IndexedDB
            <img
              src={fotoBenda.url}
              alt={`Foto ${fotoBenda.kartu.nama_benda}`}
              className="mx-auto mt-3 h-28 w-28 rounded-2xl object-cover"
            />
          ) : null}
        </section>

        <ol className={g.daftar}>
          {data.langkah.map((l, i) => (
            <li key={i} className="flex gap-3 px-4 py-3.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hijau-muda text-sm font-bold text-hijau-tua">
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

        <Link href="/kartu-benda" className={`${g.tombolTeks}`}>
          <Ikon nama="kamera" ukuran={20} /> {fotoBenda ? "Ganti kartu foto benda" : "Buat kartu foto benda"}
        </Link>

        <div className="space-y-3 pt-2">
          {saya?.anggota.izin_nilai !== false ? (
            <Link href={`/rekam?item=${encodeURIComponent(itemId)}`} className={g.tombolUtama}>
              <Ikon nama="mikrofon" /> Rekam 1 Menit
            </Link>
          ) : null}
          {selesai ? (
            <p className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-hijau-muda text-[16px] font-semibold text-hijau-tua" role="status">
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
