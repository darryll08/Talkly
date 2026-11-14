"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KepalaHijau } from "@/components/kepala-hijau";
import * as g from "@/lib/gaya";
import { API, type ResponseDari } from "@/lib/kontrak/api";
import { ALASAN_GAGAL_SISTEM } from "@/lib/kontrak/rekaman";

type StatusRekaman = ResponseDari<"rekamanLihat">;
import { panggil, GalatApi, pesanDari } from "@/lib/perangkat/panggil";
import { useSaya } from "@/lib/perangkat/saya";
import { ambilKlip } from "@/lib/perangkat/klip";
import { SedangDinilai } from "@/components/sedang-dinilai";
import { Ikon } from "@/components/ikon";

const JEDA_TANYA_MS = 2000;
/** Setelah menit pertama, bertanya lebih jarang. Server tetap mencoba ulang rekaman macet setiap 2 menit. */
const JEDA_TANYA_LAMBAT_MS = 10_000;
const CEPAT_MS = 60_000;
/** Berhenti bertanya setelah 8 menit: cukup untuk tiga percobaan server (MAKS_PERCOBAAN_PROSES) berjarak 2 menit. */
const BERHENTI_MS = 8 * 60_000;

// O5b (sedang dinilai) → O6 (umpan balik) atau O7 (rekaman ditolak).
// rekamanId dari server (page.tsx): useParams bisa tertahan di nilai sementara saat pindah dari /rekam, polling tak pernah mulai.
export function Hasil({ rekamanId }: { rekamanId: string }) {
  const router = useRouter();
  const [data, setData] = useState<StatusRekaman | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [terlaluLama, setTerlaluLama] = useState(false);
  /** Dinaikkan oleh tombol "Cek lagi" untuk memulai pertanyaan dari awal. */
  const [putaran, setPutaran] = useState(0);

  useEffect(() => {
    if (!rekamanId) return;
    let batal = false;
    let t: ReturnType<typeof setTimeout>;
    const mulai = Date.now();
    const lanjut = (jeda: number) => {
      const lewat = Date.now() - mulai;
      if (lewat >= BERHENTI_MS) return setTerlaluLama(true);
      t = setTimeout(tanya, Math.max(jeda, lewat >= CEPAT_MS ? JEDA_TANYA_LAMBAT_MS : 0));
    };
    const tanya = async () => {
      try {
        const d = await panggil(API.rekamanLihat, { id: rekamanId });
        if (batal) return;
        setGalat(null);
        if (d.status === "antre") lanjut(JEDA_TANYA_MS);
        else setData(d);
      } catch (e) {
        if (batal) return;
        if (e instanceof GalatApi && e.status === 401) return router.replace("/keluar");
        setGalat(pesanDari(e));
        // Jaringan putus atau galat sementara (5xx): terus mencoba, penilaian tetap berjalan di server.
        if (!(e instanceof GalatApi && e.status === 404)) lanjut(JEDA_TANYA_MS * 2);
      }
    };
    tanya();
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [rekamanId, router, putaran]);

  if (terlaluLama && !data) {
    return (
      <div className="muncul space-y-4 pb-4">
        <KepalaHijau kembali="/hari-ini" atas="Rekam 1 Menit" judul="Penilaian belum selesai" />
        <section className={`${g.tumpuk} bg-oranye-muda text-[17px] leading-snug`} role="status">
          Rekaman Anda sudah terkirim, tetapi penilaiannya lebih lama dari biasanya. Anda tidak perlu merekam ulang sekarang.
        </section>
        <button
          type="button"
          onClick={() => {
            setTerlaluLama(false);
            setPutaran((p) => p + 1);
          }}
          className={g.tombolUtama}
        >
          Cek lagi
        </button>
        <Link href="/hari-ini" className={`${g.tombolKedua} w-full`}>
          Kembali ke Hari ini
        </Link>
      </div>
    );
  }

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
        judul={`${panggilan === "Anda" ? "Bagus" : `Bagus, ${panggilan}`}!`}
      >
        {/* Angka giliran hanya pendukung: tanpa pembanding, angka besar terbaca seperti skor. */}
        <p className="inline-flex items-center gap-2 rounded-full bg-hijau px-3 py-1 text-[14px] font-semibold text-white">
          <Ikon nama="pesan" ukuran={16} />
          {ukuran.giliran} kali bergantian bicara dalam {Math.round(h.mutu.durasi_s)} detik
        </p>
      </KepalaHijau>

      <section className={`${g.tumpuk} bg-oranye-muda`}>
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-oranye-tua">
          <Ikon nama="bintang" isi ukuran={18} /> Yang sudah bagus
        </p>
        <p className="mt-1.5 text-[17px] leading-snug">{ub.teks_pujian}</p>
      </section>

      <section className={`${g.kartu} p-4`}>
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
          <Ikon nama="panah-kanan" ukuran={18} /> Coba besok
        </p>
        <p className="mt-1.5 text-[17px] leading-snug">{ub.teks_saran}</p>
      </section>

      <section className={`${g.kartu} space-y-3`}>
        <p className="text-[13px] font-semibold text-abu">Satu kalimat dari rekaman tadi</p>
        <div className="flex flex-col items-start">
          <span className="mb-1 px-1 text-[13px] text-abu">{panggilan} bilang:</span>
          <p className="max-w-[90%] rounded-[20px] rounded-bl-md bg-abu-muda px-4 py-2.5 text-[16px] leading-snug">
            “{ub.kutipan}”
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="mb-1 px-1 text-[13px] text-abu">Untuk {namaAnak} sekarang, coba:</span>
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

/** Tips yang paling sesuai dengan alasan tolak dari server (lib/ukur/mutu.ts), atau null bila tidak dikenali. */
function tipUtama(alasan: string | null): number | null {
  if (!alasan) return null;
  if (/tv|televisi|musik/i.test(alasan)) return 0;
  if (/kurang terdengar|kata tertangkap|dekat/i.test(alasan)) return 1;
  if (/terhenti|ditinggal|layar mati/i.test(alasan)) return 2;
  if (/detik/i.test(alasan)) return 3;
  return null;
}

function Ditolak({ alasan }: { alasan: string | null }) {
  // Gagal di sisi server: bukan salah cara merekam, jadi tips merekam tidak ditampilkan.
  const gagalSistem = alasan === ALASAN_GAGAL_SISTEM;
  const utama = tipUtama(alasan);
  const sisa = TIPS.map((t, i) => ({ t, i })).filter(({ i }) => i !== utama);
  return (
    <div className="muncul space-y-4 pb-4">
      <KepalaHijau kembali="/hari-ini" atas="Rekam 1 Menit" judul="Rekaman belum bisa dinilai" />
      <section className={`${g.tumpuk} bg-oranye-muda text-[17px] leading-snug`}>
        {alasan ?? "Suara dalam rekaman ini kurang jelas untuk dinilai."}
      </section>
      <p className="px-1 text-[15px] leading-snug text-abu">
        {gagalSistem
          ? "Audio rekaman ini sudah dihapus."
          : "Talkly tidak menebak bila suaranya kurang jelas, jadi rekaman ini tidak dinilai. Audio rekaman ini sudah dihapus."}
      </p>
      {gagalSistem ? null : (
        <section className="space-y-2">
          <h2 className={g.labelSeksi}>Agar rekaman berikutnya bisa dinilai</h2>
          {utama !== null ? (
            <p className="flex items-start gap-3 rounded-2xl bg-permukaan p-4 text-[17px] font-semibold leading-snug shadow-kartu ring-2 ring-hijau">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-hijau text-white">
                <Ikon nama="centang" ukuran={18} />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-hijau-tua">Coba ini dulu</span>
                {TIPS[utama]}
              </span>
            </p>
          ) : null}
          <ol className={g.daftar} aria-label={utama !== null ? "Tips lain" : undefined}>
            {sisa.map(({ t }, n) => (
              <li key={t} className="flex gap-3 px-4 py-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-oranye text-sm font-bold text-foreground">
                  {n + 1}
                </span>
                <span className={`leading-snug ${utama !== null ? "text-[15px] text-abu" : "text-[16px]"}`}>{t}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
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
