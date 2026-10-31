"use client";

import { useEffect, useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { jumlahAntrean, kirimAntrean } from "@/lib/perangkat/antrean";
import { notifikasiUji } from "@/lib/perangkat/notifikasi";
import { useRekam } from "@/lib/perangkat/use-rekam";
import { sudahTerpasang } from "@/components/pasang-aplikasi";
import { KepalaHalaman } from "@/components/kepala-halaman";
import { Ikon } from "@/components/ikon";

type Baris = { nama: string; ok: boolean | null; catatan?: string };

async function periksaPerangkat(): Promise<Baris[]> {
  const antre = await jumlahAntrean();
  const idb = typeof indexedDB !== "undefined";
  const sw = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration("/") : undefined;
  return [
    { nama: "HTTPS", ok: window.isSecureContext },
    { nama: "MediaRecorder Opus", ok: typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus") },
    { nama: "Wake Lock", ok: "wakeLock" in navigator },
    { nama: "AudioWorklet", ok: typeof AudioWorkletNode !== "undefined" },
    { nama: "IndexedDB", ok: idb, catatan: idb ? `${antre} rekaman mengantre` : undefined },
    { nama: "Service worker", ok: Boolean(sw), catatan: sw ? undefined : "aktif di build produksi" },
    { nama: "Web Push", ok: "PushManager" in window },
    {
      nama: "Izin notifikasi",
      ok: "Notification" in window ? Notification.permission === "granted" : false,
      catatan: "Notification" in window ? Notification.permission : "tidak didukung",
    },
    { nama: "Terpasang di layar utama", ok: sudahTerpasang() },
  ];
}

// Cek perangkat: daftar Ya/Tidak untuk kemampuan ponsel dan layanan server.
export default function CekPerangkat() {
  const [perangkat, setPerangkat] = useState<Baris[] | null>(null);
  const [server, setServer] = useState<Baris[] | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const r = useRekam();

  useEffect(() => {
    let batal = false;
    periksaPerangkat().then((b) => !batal && setPerangkat(b));
    panggil(API.tesSambungan)
      .then(
        (d) =>
          !batal &&
          setServer(
            ([["Supabase", d.supabase], ["ElevenLabs", d.elevenlabs], ["OpenAI", d.openai], ["Push", d.push]] as const).map(([nama, l]) => ({
              nama,
              ok: l.ok,
              catatan: l.pesan,
            })),
          ),
      )
      .catch((e) => !batal && setServer([{ nama: "Server", ok: false, catatan: pesanDari(e) }]));
    return () => {
      batal = true;
    };
  }, []);

  async function aksi(f: () => Promise<string>) {
    setPesan(null);
    try {
      setPesan(await f());
    } catch (e) {
      setPesan(e instanceof Error ? e.message : pesanDari(e));
    }
    periksaPerangkat().then(setPerangkat);
  }

  return (
    <div className="space-y-5 pb-4">
      <KepalaHalaman kembali="/" judul="Cek perangkat" />
      <div className="muncul space-y-5">
        <header className="space-y-1">
          <p className={g.labelAtas}>Talkly</p>
          <h1 className={g.judulHalaman}>Cek perangkat</h1>
        </header>
        <Daftar judul="Ponsel ini" baris={perangkat} />
        <Daftar judul="Layanan server" baris={server} />

        <section className="space-y-3">
          <h2 className={g.labelSeksi}>Uji</h2>
          {r.tahap === "merekam" ? (
            <button type="button" onClick={r.berhenti} className={g.tombolUtama}>
              Berhenti ({Math.floor(r.detik)} detik)
            </button>
          ) : (
            <button type="button" onClick={r.mulai} className={g.tombolKedua}>
              <Ikon nama="mikrofon" /> Uji rekam
            </button>
          )}
          {r.hasil ? (
            <div className={`${g.kartu} space-y-2`}>
              <audio src={r.hasil.url} controls className="w-full" />
              <p className="text-[14px] text-abu">
                {r.hasil.durasi_s} detik · {(r.hasil.blob.size / 1024).toFixed(0)} KB · {r.hasil.jejak.length} frame jejak nada ·{" "}
                {r.hasil.kandidat_suara_anak.length} kandidat suara bernada tinggi
              </p>
            </div>
          ) : null}
          {r.galat ? <p className={g.kotakGalat}>{r.galat}</p> : null}
          <button type="button" onClick={() => aksi(async () => (await notifikasiUji(), "Notifikasi uji dikirim."))} className={g.tombolKedua}>
            <Ikon nama="lonceng" /> Uji notifikasi
          </button>
          <button
            type="button"
            onClick={() => aksi(async () => {
              const h = await kirimAntrean();
              return `${h.terkirim} rekaman terkirim, ${h.sisa} masih mengantre.`;
            })}
            className={g.tombolKedua}
          >
            Kirim antrean sekarang
          </button>
          {pesan ? (
            <p className="rounded-2xl bg-hijau-muda px-4 py-3 text-[15px] text-hijau-tua" role="status">
              {pesan}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Daftar({ judul, baris }: { judul: string; baris: Baris[] | null }) {
  return (
    <section className="space-y-2">
      <h2 className={g.labelSeksi}>{judul}</h2>
      {!baris ? (
        <div className="kerangka h-40 w-full rounded-2xl" />
      ) : (
        <ul className={g.daftar}>
          {baris.map((b) => (
            <li key={b.nama} className={g.barisDaftar}>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{b.nama}</span>
                {b.catatan ? <span className="block text-[13px] text-abu">{b.catatan}</span> : null}
              </span>
              <span className={`text-[15px] font-semibold ${b.ok ? "text-hijau-tua" : "text-oranye-tua"}`}>{b.ok ? "Ya" : "Tidak"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
