"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useParamRute } from "@/lib/perangkat/param";
import { KepalaHijau } from "@/components/kepala-hijau";
import * as g from "@/lib/gaya";
import { API, type ResponseDari } from "@/lib/kontrak/api";

type StatusRekaman = ResponseDari<"rekamanLihat">;
import { panggil, GalatApi, pesanDari } from "@/lib/perangkat/panggil";
import { useSaya } from "@/lib/perangkat/saya";
import { ambilKlip } from "@/lib/perangkat/klip";
import { SedangDinilai } from "@/components/sedang-dinilai";
import { Ikon } from "@/components/ikon";

const JEDA_TANYA_MS = 2000;

// O5b (sedang dinilai) → O6 (umpan balik) atau O7 (rekaman ditolak).
export function Hasil() {
  const rekamanId = useParamRute("rekamanId");
  const router = useRouter();
  const [data, setData] = useState<StatusRekaman | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    if (!rekamanId) return;
    let batal = false;
    let t: ReturnType<typeof setTimeout>;
    const tanya = async () => {
      try {
        const d = await panggil(API.rekamanLihat, { id: rekamanId });
        if (batal) return;
        setGalat(null);
        if (d.status === "antre") t = setTimeout(tanya, JEDA_TANYA_MS);
        else setData(d);
      } catch (e) {
        if (batal) return;
        if (e instanceof GalatApi && e.status === 401) return router.replace("/keluar");
        setGalat(pesanDari(e));
        // Jaringan putus: terus mencoba, penilaian tetap berjalan di server.
        if (e instanceof GalatApi && e.status === 0) t = setTimeout(tanya, JEDA_TANYA_MS * 2);
      }
    };
    tanya();
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [rekamanId, router]);

  if (!data || !rekamanId) {
    return (
      <div className="muncul space-y-5">
        <KepalaHijau atas="Rekam 1 Menit" judul="Sedang dinilai" />
        <div className="relative z-10 -mt-9">
          <SedangDinilai />
        </div>
        {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
      </div>
    );
  }
  if (data.status === "ditolak" || !data.hasil?.umpan_balik || !data.hasil.ukuran) return <Ditolak alasan={data.alasan_tolak} />;
  return <UmpanBalik rekamanId={rekamanId} data={data} />;
}

function UmpanBalik({ rekamanId, data }: { rekamanId: string; data: StatusRekaman }) {
  const { data: saya } = useSaya();
  const h = data.hasil!;
  const ub = h.umpan_balik!;
  const ukuran = h.ukuran!;
  const namaAnak = saya?.anak.nama ?? "anak";
  const namaTerapis = saya?.anak.terapis.nama ?? "terapis";
  const panggilan = saya?.anggota.peran === "ibu" ? "Ibu" : saya?.anggota.peran === "ayah" ? "Ayah" : "Anda";

  return (
    <div className="muncul space-y-4 pb-4">
      <KepalaHijau
        kembali="/hari-ini"
        atas={data.rekaman_contoh ? "Rekaman contoh · Umpan balik" : "Umpan balik"}
        judul={
          <span className="flex items-baseline gap-3">
            <span className="text-[72px] leading-none">{ukuran.giliran}</span>
            <span className="text-[22px] leading-tight">giliran percakapan dalam {Math.round(h.mutu.durasi_s)} detik</span>
          </span>
        }
      />

      <section className={`${g.tumpuk} bg-oranye-muda`}>
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-oranye-tua">
          <Ikon nama="bintang" isi ukuran={18} /> Yang sudah bagus
        </p>
        <p className="mt-1.5 text-[17px] leading-snug">{ub.teks_pujian}</p>
      </section>

      <section className="rounded-2xl bg-hijau-muda p-4">
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-hijau-tua">
          <Ikon nama="panah-kanan" ukuran={18} /> Coba besok
        </p>
        <p className="mt-1.5 text-[17px] leading-snug">{ub.teks_saran}</p>
      </section>

      <section className={`${g.kartu} space-y-3`}>
        <p className="text-[13px] font-semibold text-abu">Satu kalimat dari rekaman tadi</p>
        <div className="flex flex-col items-start">
          <span className="mb-1 px-1 text-xs text-abu">{panggilan} bilang:</span>
          <p className="max-w-[90%] rounded-[20px] rounded-bl-md bg-abu-muda px-4 py-2.5 text-[16px] leading-snug">
            “{ub.kutipan}”
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="mb-1 px-1 text-xs text-abu">Untuk {namaAnak} sekarang, coba:</span>
          <p className="font-judul max-w-[90%] rounded-[20px] rounded-br-md bg-hijau px-4 py-2.5 text-[24px] font-extrabold text-white">
            “{ub.versi_anak}”
          </p>
          <span className="mt-1 px-1 text-[14px] text-abu">lalu tunggu.</span>
        </div>
      </section>

      {ub.momen && saya?.anggota.izin_klip ? <Momen rekamanId={rekamanId} namaAnak={namaAnak} momen={ub.momen} /> : null}

      <Link href="/hari-ini" className={g.tombolUtama}>
        Kembali ke Hari ini
      </Link>

      <KurangTepat rekamanId={rekamanId} namaTerapis={namaTerapis} />
    </div>
  );
}

/** Momen anak: putar 5 detik dari audio yang disimpan di ponsel ini. */
function Momen({ rekamanId, namaAnak, momen }: { rekamanId: string; namaAnak: string; momen: { t_mulai: number; t_selesai: number } }) {
  const [url, setUrl] = useState<string | null>(null);
  const [main, setMain] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let u: string | null = null;
    ambilKlip(rekamanId).then((b) => {
      if (!b) return;
      u = URL.createObjectURL(b);
      setUrl(u);
    });
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [rekamanId]);

  if (!url) return null;

  function putar() {
    const a = audio.current;
    if (!a) return;
    if (main) {
      a.pause();
      return;
    }
    a.currentTime = momen.t_mulai;
    a.play().catch(() => setMain(false));
  }

  return (
    <section className={`${g.kartu} flex items-center gap-4`}>
      <button
        type="button"
        onClick={putar}
        aria-label={main ? `Hentikan Momen ${namaAnak}` : `Putar Momen ${namaAnak}`}
        className="tekan inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-oranye-tua text-white shadow-kartu"
      >
        <Ikon nama={main ? "jeda" : "putar"} isi />
      </button>
      <div>
        <p className="font-semibold">Momen {namaAnak}</p>
        <p className="text-[14px] text-abu">5 detik saat Anda menunggu lalu {namaAnak} bersuara</p>
      </div>
      <audio
        ref={audio}
        src={url}
        preload="auto"
        onPlay={() => setMain(true)}
        onPause={() => setMain(false)}
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime >= momen.t_selesai) e.currentTarget.pause();
        }}
      />
    </section>
  );
}

function KurangTepat({ rekamanId, namaTerapis }: { rekamanId: string; namaTerapis: string }) {
  const [tahap, setTahap] = useState<"awal" | "tanya" | "kirim" | "selesai">("awal");
  const [galat, setGalat] = useState<string | null>(null);

  async function tandai() {
    setTahap("kirim");
    setGalat(null);
    try {
      await panggil(API.rekamanKurangTepat, { id: rekamanId });
      setTahap("selesai");
    } catch (e) {
      setGalat(pesanDari(e));
      setTahap("tanya");
    }
  }

  if (tahap === "selesai") {
    return (
      <p className="px-1 text-center text-[15px] text-abu" role="status">
        Terima kasih. {namaTerapis} akan memeriksa hasil ini.
      </p>
    );
  }
  if (tahap === "awal") {
    return (
      <button type="button" onClick={() => setTahap("tanya")} className={`${g.tombolTeks} w-full justify-center text-abu`}>
        Hasil ini kurang tepat?
      </button>
    );
  }
  return (
    <section className={`${g.kartu} space-y-3`}>
      <p className="text-[16px]">Tandai hasil ini kurang tepat? {namaTerapis} akan memeriksanya sebelum sesi.</p>
      {galat ? <p className={g.kotakGalat}>{galat}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setTahap("awal")} className={g.tombolKedua}>
          Batal
        </button>
        <button type="button" onClick={tandai} disabled={tahap === "kirim"} className={g.tombolUtama}>
          Ya, tandai
        </button>
      </div>
    </section>
  );
}

const TIPS = [
  "Matikan televisi, radio, atau musik selama satu menit.",
  "Taruh ponsel di meja, sekitar satu meter dari Anda dan anak.",
  "Biarkan layar tetap menyala dan jangan berpindah aplikasi.",
  "Terus ajak bicara seperti biasa ke balita, sampai sedikitnya 40 detik.",
];

function Ditolak({ alasan }: { alasan: string | null }) {
  return (
    <div className="muncul space-y-4 pb-4">
      <KepalaHijau kembali="/hari-ini" atas="Rekam 1 Menit" judul="Rekaman belum bisa dinilai" />
      <section className={`${g.tumpuk} bg-oranye-muda text-[17px] leading-snug`}>
        {alasan ?? "Suara dalam rekaman ini kurang jelas untuk dinilai."}
      </section>
      <p className="px-1 text-[15px] leading-snug text-abu">
        Talkly tidak menebak bila suaranya kurang jelas, jadi rekaman ini tidak dinilai. Audio rekaman ini sudah dihapus.
      </p>
      <section className="space-y-2">
        <h2 className={g.labelSeksi}>Agar rekaman berikutnya bisa dinilai</h2>
        <ol className={g.daftar}>
          {TIPS.map((t, i) => (
            <li key={t} className="flex gap-3 px-4 py-3">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hijau-muda text-sm font-bold text-hijau-tua">
                {i + 1}
              </span>
              <span className="text-[16px] leading-snug">{t}</span>
            </li>
          ))}
        </ol>
      </section>
      <div className="space-y-3">
        <Link href="/rekam" className={g.tombolUtama}>
          Rekam ulang
        </Link>
        <Link href="/ceritakan" className={g.tombolKedua}>
          Ceritakan sendiri
        </Link>
      </div>
    </div>
  );
}
