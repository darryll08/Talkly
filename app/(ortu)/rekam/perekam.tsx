"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { useSaya } from "@/lib/perangkat/saya";
import { adaBerkas } from "@/lib/perangkat/panggil";
import { useRekam, MIN_DETIK, MAKS_DETIK } from "@/lib/perangkat/use-rekam";
import { unggahRekaman, idLokalBaru } from "@/lib/perangkat/antrean";
import { simpanKlip } from "@/lib/perangkat/klip";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Memuat } from "@/components/memuat";
import { Ikon } from "@/components/ikon";

const CADANGAN = "/demo/rekaman-cadangan.webm";
/** Hitung mundur setelah "Saya mulai menunggu": hitung sampai lima dalam hati. */
const LAMA_TUNGGU_S = 5;

type Kiriman =
  | { keadaan: "diam" }
  | { keadaan: "mengirim" }
  | { keadaan: "antre" }
  | { keadaan: "ditolak"; pesan: string };

export function Perekam() {
  const router = useRouter();
  const item = useSearchParams().get("item");
  const { data: saya } = useSaya();
  const aktivitas = useData(API.aktivitasLihat, { itemId: item ?? "" }, { aktif: Boolean(item) });
  const pengelola = saya?.anggota.pengelola ?? false;
  const keluarga = useData(API.keluargaMingguIni, undefined, { aktif: pengelola });
  const r = useRekam();

  const [perekamId, setPerekamId] = useState<string | null>(null);
  const [adaCadangan, setAdaCadangan] = useState(false);
  const [cadangan, setCadangan] = useState<{ blob: Blob; url: string } | null>(null);
  const [kiriman, setKiriman] = useState<Kiriman>({ keadaan: "diam" });

  useEffect(() => {
    adaBerkas(CADANGAN).then(setAdaCadangan);
  }, []);

  if (!saya) return <Memuat />;

  const idPerekam = perekamId ?? saya.anggota.id;
  const anggotaKeluarga = keluarga.data?.anggota ?? [];
  const perekam = anggotaKeluarga.find((a) => a.id === idPerekam);
  const izinPerekam = perekam ? perekam.izin_nilai : saya.anggota.izin_nilai;
  const kata = aktivitas.data?.kata_target ?? saya.anak.kata_target.slice(0, 3);
  const namaAnak = saya.anak.nama;

  async function pakaiCadangan() {
    const res = await fetch(CADANGAN);
    const blob = await res.blob();
    setCadangan({ blob, url: URL.createObjectURL(blob) });
  }

  async function kirim() {
    const blob = cadangan?.blob ?? r.hasil?.blob;
    if (!blob) return;
    setKiriman({ keadaan: "mengirim" });
    const meta = {
      id_lokal: idLokalBaru(),
      perekam_id: idPerekam,
      rencana_item_id: item,
      durasi_s: cadangan ? 58 : (r.hasil?.durasi_s ?? 0),
      terputus: cadangan ? false : (r.hasil?.terputus ?? false),
      mulai_menunggu_s: cadangan ? [] : (r.hasil?.mulai_menunggu_s ?? []),
      rekaman_cadangan: Boolean(cadangan),
      jejak: cadangan ? [] : (r.hasil?.jejak ?? []),
      kandidat_suara_anak: cadangan ? [] : (r.hasil?.kandidat_suara_anak ?? []),
    };
    const h = await unggahRekaman(blob, meta);
    if (h.status === "terkirim") {
      if (saya?.anggota.izin_klip) await simpanKlip(h.rekaman_id, blob).catch(() => {});
      router.push(`/hasil/${h.rekaman_id}`);
    } else if (h.status === "antre") {
      setKiriman({ keadaan: "antre" });
    } else {
      setKiriman({ keadaan: "ditolak", pesan: h.pesan });
    }
  }

  function ulang() {
    setCadangan(null);
    setKiriman({ keadaan: "diam" });
    r.ulang();
  }

  async function ulangiDariAwal() {
    await r.batal();
    r.mulai();
  }

  // ---------- Merekam ----------
  if (r.tahap === "merekam") {
    const sisaTunggu = r.tandaTerakhir === null ? 0 : Math.ceil(LAMA_TUNGGU_S - (r.detik - r.tandaTerakhir));
    const sedangMenunggu = sisaTunggu > 0;
    return (
      <div className="flex min-h-dvh flex-col items-center gap-6 py-8 text-center">
        <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-oranye-tua" role="status">
          <span className="titik-rekam h-2.5 w-2.5 rounded-full bg-oranye" /> Merekam
        </p>
        <CincinWaktu detik={r.detik} tunggu={sedangMenunggu ? sisaTunggu : null} />
        <div className="flex flex-wrap justify-center gap-2">
          {kata.map((k: string) => (
            <span key={k} className={g.labelKata}>
              {k}
            </span>
          ))}
        </div>
        <p className="max-w-xs text-[16px] text-abu" aria-live="polite">
          {sedangMenunggu
            ? `Tunggu ${namaAnak} menjawab… jangan mengulang pertanyaan dulu.`
            : r.jumlahTanda > 0
              ? `Bagus, ${r.jumlahTanda} kali menunggu. Tekan lagi setiap selesai bertanya.`
              : "Setelah bertanya ke anak, tekan “Saya mulai menunggu” lalu diam sejenak."}
        </p>
        {r.wakeLockGagal ? (
          <p className={g.kotakGalat}>Layar mungkin mati sendiri. Sentuh layar sesekali agar tetap menyala.</p>
        ) : null}
        {r.sempatDitinggal ? (
          <p className={g.kotakGalat}>Aplikasi sempat ditinggal, jadi rekaman ini mungkin ditolak. Sebaiknya rekam ulang.</p>
        ) : null}
        <div className="mt-auto w-full space-y-3">
          <button
            type="button"
            onClick={r.tandaiMenunggu}
            disabled={sedangMenunggu}
            className={`${g.tombolKedua} ${sedangMenunggu ? "disabled:bg-hijau-muda disabled:text-hijau-tua disabled:ring-hijau/30" : ""}`}
          >
            {sedangMenunggu ? `Menunggu… ${sisaTunggu}` : "Saya mulai menunggu"}
          </button>
          <button type="button" onClick={r.berhenti} className={g.tombolUtama}>
            {r.cukupPanjang ? "Selesai merekam" : "Berhenti"}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={ulangiDariAwal} className={`${g.tombolTeks} justify-center`}>
              <Ikon nama="putar" ukuran={18} /> Ulang dari awal
            </button>
            <button type="button" onClick={() => r.batal()} className={`${g.tombolTeks} justify-center text-oranye-tua`}>
              <Ikon nama="silang" ukuran={18} /> Batal
            </button>
          </div>
          {!r.cukupPanjang ? (
            <p className="text-[13px] text-abu">Rekaman baru bisa dinilai setelah {MIN_DETIK} detik.</p>
          ) : null}
        </div>
      </div>
    );
  }

  // ---------- Selesai ----------
  const putar = cadangan?.url ?? (r.tahap === "selesai" ? r.hasil?.url : null);
  // Server menolak rekaman di bawah 40 detik, jadi rekaman pendek tidak ditawarkan untuk dikirim.
  const terlaluPendek = !cadangan && (r.hasil?.durasi_s ?? 0) < MIN_DETIK;
  if (putar) {
    return (
      <div className="space-y-5 pb-4">
        <KepalaHalaman kembali="/hari-ini" judul="Rekam 1 Menit" />
        <div className="muncul space-y-5">
          <header className="space-y-1">
            <p className={g.labelAtas}>{cadangan ? "Rekaman cadangan · rekaman contoh" : `${Math.round(r.hasil?.durasi_s ?? 0)} detik`}</p>
            <h1 className={g.judulHalaman}>{terlaluPendek ? "Rekaman terlalu pendek" : "Rekaman siap dikirim"}</h1>
          </header>
          <div className={g.kartu}>
            <audio src={putar} controls className="w-full" />
          </div>
          {kiriman.keadaan === "antre" ? (
            <p className={g.kotakGalat} role="status">
              Belum terkirim. Rekaman disimpan di ponsel dan dikirim otomatis saat sinyal kembali.
            </p>
          ) : null}
          {kiriman.keadaan === "ditolak" ? <p className={g.kotakGalat}>{kiriman.pesan}</p> : null}
          {terlaluPendek ? (
            <p className={g.kotakGalat}>
              Rekaman baru {Math.round(r.hasil?.durasi_s ?? 0)} detik. Supaya bisa dinilai, rekam paling tidak {MIN_DETIK} detik.
            </p>
          ) : null}
          <div className="space-y-3">
            {terlaluPendek ? (
              <button type="button" onClick={ulang} className={g.tombolUtama}>
                <Ikon nama="mikrofon" /> Rekam ulang
              </button>
            ) : kiriman.keadaan === "antre" ? (
              <Link href="/hari-ini" className={g.tombolUtama}>
                Kembali ke Hari ini
              </Link>
            ) : (
              <button type="button" onClick={kirim} disabled={kiriman.keadaan === "mengirim"} className={g.tombolUtama}>
                {kiriman.keadaan === "mengirim" ? "Mengirim…" : "Kirim untuk dinilai"}
              </button>
            )}
            {terlaluPendek ? (
              <Link href="/hari-ini" className={g.tombolKedua}>
                Kembali ke Hari ini
              </Link>
            ) : (
              <button type="button" onClick={ulang} disabled={kiriman.keadaan === "mengirim"} className={g.tombolKedua}>
                Rekam ulang
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Siap ----------
  return (
    <div className="space-y-5 pb-4">
      <KepalaHalaman kembali={item ? `/aktivitas/${item}` : "/hari-ini"} judul="Rekam 1 Menit" />
      <div className="muncul space-y-5">
        <header className="space-y-1">
          <p className={g.labelAtas}>{aktivitas.data?.judul ?? `Latihan ${namaAnak}`}</p>
          <h1 className={g.judulHalaman}>Rekam 1 Menit</h1>
        </header>

        <section className={`${g.kartu} space-y-4`}>
          <div className="flex flex-wrap gap-2">
            {kata.map((k: string) => (
              <span key={k} className={g.labelKata}>
                {k}
              </span>
            ))}
          </div>
          <p className="text-[17px] font-semibold leading-snug">Setelah bertanya, hitung sampai lima dalam hati.</p>
          <p className="flex gap-2 text-[15px] leading-snug text-abu">
            <Ikon nama="info" ukuran={20} className="shrink-0" />
            Taruh ponsel di meja dengan layar menghadap ke atas. {namaAnak} tidak perlu melihat layar.
          </p>
        </section>

        {pengelola && anggotaKeluarga.length > 1 ? (
          <fieldset className="space-y-2">
            <legend className={`${g.labelSeksi} mb-2`}>Yang merekam</legend>
            <div className={g.daftar}>
              {anggotaKeluarga.map((a) => (
                <label key={a.id} className={`${g.barisDaftar} cursor-pointer`}>
                  <input
                    type="radio"
                    name="perekam"
                    checked={idPerekam === a.id}
                    onChange={() => setPerekamId(a.id)}
                    className="h-5 w-5 accent-[var(--hijau)]"
                  />
                  <span className="flex-1 font-medium">
                    {a.nama}
                    {a.saya ? " (Anda)" : ""}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {!izinPerekam ? (
          <div className={`${g.kotakGalat} space-y-2`}>
            <p>
              {perekam && !perekam.saya ? `${perekam.nama} belum` : "Anda belum"} mengizinkan rekaman dinilai. Izin ini
              hanya bisa dinyalakan oleh orang yang suaranya direkam.
            </p>
            <p className="flex flex-wrap gap-x-4">
              <Link href="/profil" className="font-semibold underline-offset-2 hover:underline">
                Buka Profil
              </Link>
              <Link href="/ceritakan" className="font-semibold underline-offset-2 hover:underline">
                Ceritakan sendiri
              </Link>
            </p>
          </div>
        ) : null}

        {r.galat ? <p className={g.kotakGalat}>{r.galat}</p> : null}

        <div className="space-y-3">
          <button
            type="button"
            onClick={r.mulai}
            disabled={!izinPerekam || r.tahap === "meminta-izin"}
            className={g.tombolUtama}
          >
            <Ikon nama="mikrofon" /> {r.tahap === "meminta-izin" ? "Meminta izin mikrofon…" : "Mulai merekam"}
          </button>
          {adaCadangan ? (
            <button type="button" onClick={pakaiCadangan} disabled={!izinPerekam} className={g.tombolKedua}>
              Pakai rekaman cadangan
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Cincin 60 detik yang terisi, dengan titik penanda 40 detik. Saat menunggu, tengahnya jadi hitung mundur 5 detik. */
function CincinWaktu({ detik, tunggu }: { detik: number; tunggu: number | null }) {
  const R = 92;
  const K = 2 * Math.PI * R;
  const sisa = Math.max(0, Math.ceil(MAKS_DETIK - detik));
  const sudut40 = (MIN_DETIK / MAKS_DETIK) * 2 * Math.PI - Math.PI / 2;
  const aktif40 = detik >= MIN_DETIK;
  return (
    <div className="relative h-[220px] w-[220px]">
      <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden="true">
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--abu-muda)" strokeWidth="12" />
        <circle
          cx="110"
          cy="110"
          r={R}
          fill="none"
          stroke="var(--hijau)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={K}
          strokeDashoffset={K * (1 - Math.min(1, detik / MAKS_DETIK))}
          transform="rotate(-90 110 110)"
          style={{ transition: "stroke-dashoffset 100ms linear" }}
        />
        <circle
          cx={110 + R * Math.cos(sudut40)}
          cy={110 + R * Math.sin(sudut40)}
          r="7"
          fill={aktif40 ? "var(--hijau-tua)" : "var(--permukaan)"}
          stroke={aktif40 ? "var(--permukaan)" : "var(--abu)"}
          strokeWidth="2.5"
        />
      </svg>
      {tunggu !== null ? (
        <div className="absolute inset-[26px] flex flex-col items-center justify-center rounded-full bg-hijau-muda">
          <span className="text-[13px] font-semibold text-hijau-tua">Tunggu</span>
          <span className="text-[56px] font-bold leading-none tabular-nums text-hijau-tua" aria-live="off">
            {tunggu}
          </span>
          <span className="text-[13px] text-hijau-tua">0:{String(sisa).padStart(2, "0")} tersisa</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[44px] font-bold tabular-nums" aria-live="off">
            0:{String(sisa).padStart(2, "0")}
          </span>
          <span className="text-[13px] text-abu">{aktif40 ? "Sudah cukup untuk dinilai" : "tersisa"}</span>
        </div>
      )}
    </div>
  );
}
