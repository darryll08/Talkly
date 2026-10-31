"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { kandidatSuaraAnak, ringkasJejak, type Frame, type Kandidat } from "./jejak";

export const MIN_DETIK = 40;
export const MAKS_DETIK = 60;
const SEMBUNYI_MAKS_MS = 2000;

export type Tahap = "siap" | "meminta-izin" | "merekam" | "selesai" | "galat";

export type HasilRekam = {
  blob: Blob;
  url: string;
  durasi_s: number;
  terputus: boolean;
  mulai_menunggu_s: number[];
  jejak: Frame[];
  kandidat_suara_anak: Kandidat[];
};

const MIME = "audio/webm;codecs=opus";

function pesanGalat(e: unknown): string {
  const nama = e instanceof DOMException ? e.name : "";
  if (nama === "NotAllowedError" || nama === "SecurityError") {
    return "Izin mikrofon ditolak. Di Chrome, ketuk ikon gembok di sebelah alamat situs → Izin → Mikrofon → Izinkan, lalu muat ulang halaman ini.";
  }
  if (nama === "NotFoundError") return "Mikrofon tidak ditemukan di perangkat ini.";
  if (nama === "NotReadableError") return "Mikrofon sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.";
  return "Perekaman tidak bisa dimulai di peramban ini. Gunakan Chrome di Android.";
}

/**
 * Perekam 1 menit: MediaRecorder Opus 32 kbps mono, Wake Lock, jejak nada lewat AudioWorklet.
 * echoCancellation dan noiseSuppression dimatikan agar suara anak tidak terpotong.
 */
export function useRekam() {
  const [tahap, setTahap] = useState<Tahap>("siap");
  const [detik, setDetik] = useState(0);
  const [galat, setGalat] = useState<string | null>(null);
  const [hasil, setHasil] = useState<HasilRekam | null>(null);
  const [wakeLockGagal, setWakeLockGagal] = useState(false);
  const [sempatDitinggal, setSempatDitinggal] = useState(false);
  /** Detik saat "Saya mulai menunggu" terakhir ditekan, untuk hitung mundur 5 detik di layar. */
  const [tandaTerakhir, setTandaTerakhir] = useState<number | null>(null);
  const [jumlahTanda, setJumlahTanda] = useState(0);

  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const potongan = useRef<Blob[]>([]);
  const frames = useRef<Frame[]>([]);
  const menunggu = useRef<number[]>([]);
  const mulaiMs = useRef(0);
  const terputus = useRef(false);
  const sembunyiSejak = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlLama = useRef<string | null>(null);
  /** Diisi oleh batal(): rekaman yang sedang berjalan dibuang, bukan dijadikan hasil. */
  const buang = useRef<(() => void) | null>(null);

  const mintaWakeLock = useCallback(async () => {
    try {
      if (!("wakeLock" in navigator)) throw new Error("tidak didukung");
      wakeLock.current = await navigator.wakeLock.request("screen");
      setWakeLockGagal(false);
    } catch {
      setWakeLockGagal(true);
    }
  }, []);

  const bersihkan = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
  }, []);

  const berhenti = useCallback(() => {
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }, []);

  const mulai = useCallback(async () => {
    setGalat(null);
    setHasil(null);
    setSempatDitinggal(false);
    setTandaTerakhir(null);
    setJumlahTanda(0);
    setTahap("meminta-izin");
    try {
      if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported(MIME)) {
        throw new Error("opus");
      }
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
      stream.current = s;

      // Jejak nada; bila AudioWorklet gagal, perekaman tetap berjalan tanpa jejak.
      frames.current = [];
      try {
        const ctx = new AudioContext();
        audioCtx.current = ctx;
        await ctx.audioWorklet.addModule("/worklet/jejak-nada.js");
        const sumber = ctx.createMediaStreamSource(s);
        const node = new AudioWorkletNode(ctx, "jejak-nada");
        node.port.onmessage = (e: MessageEvent<Frame>) => frames.current.push(e.data);
        sumber.connect(node);
      } catch {
        frames.current = [];
      }

      const r = new MediaRecorder(s, { mimeType: MIME, audioBitsPerSecond: 32000 });
      rec.current = r;
      potongan.current = [];
      menunggu.current = [];
      terputus.current = false;
      r.ondataavailable = (e) => {
        if (e.data.size > 0) potongan.current.push(e.data);
      };
      r.onstop = () => {
        if (buang.current) {
          const selesai = buang.current;
          buang.current = null;
          bersihkan();
          setDetik(0);
          setTahap("siap");
          selesai();
          return;
        }
        const durasi = Math.min(MAKS_DETIK, Math.round(((performance.now() - mulaiMs.current) / 1000) * 10) / 10);
        const blob = new Blob(potongan.current, { type: "audio/webm" });
        if (urlLama.current) URL.revokeObjectURL(urlLama.current);
        const url = URL.createObjectURL(blob);
        urlLama.current = url;
        const jejak = ringkasJejak(frames.current);
        setHasil({
          blob,
          url,
          durasi_s: durasi,
          terputus: terputus.current,
          mulai_menunggu_s: [...menunggu.current],
          jejak,
          kandidat_suara_anak: kandidatSuaraAnak(jejak),
        });
        bersihkan();
        setTahap("selesai");
      };

      await mintaWakeLock();
      mulaiMs.current = performance.now();
      setDetik(0);
      r.start(1000);
      setTahap("merekam");
      timer.current = setInterval(() => {
        const d = (performance.now() - mulaiMs.current) / 1000;
        setDetik(Math.min(MAKS_DETIK, d));
        if (d >= MAKS_DETIK) berhenti();
      }, 100);
    } catch (e) {
      bersihkan();
      setGalat(e instanceof Error && e.message === "opus" ? "Peramban ini belum bisa merekam format Opus. Gunakan Chrome di Android." : pesanGalat(e));
      setTahap("galat");
    }
  }, [berhenti, bersihkan, mintaWakeLock]);

  const tandaiMenunggu = useCallback(() => {
    if (!rec.current || rec.current.state !== "recording") return;
    const t = Math.round(((performance.now() - mulaiMs.current) / 1000) * 10) / 10;
    menunggu.current.push(t);
    setTandaTerakhir(t);
    setJumlahTanda((n) => n + 1);
  }, []);

  /** Hentikan rekaman yang sedang berjalan tanpa menyimpannya. Selesai saat perekam benar-benar berhenti. */
  const batal = useCallback(
    () =>
      new Promise<void>((selesai) => {
        if (!rec.current || rec.current.state === "inactive") return selesai();
        buang.current = selesai;
        rec.current.stop();
      }),
    [],
  );

  const ulang = useCallback(() => {
    setHasil(null);
    setDetik(0);
    setTahap("siap");
  }, []);

  // Wake Lock lepas saat halaman tersembunyi; minta lagi saat kembali.
  // Halaman tersembunyi lebih dari 2 detik membuat rekaman ditandai terputus.
  useEffect(() => {
    const saatBerubah = () => {
      const merekam = rec.current?.state === "recording";
      if (document.visibilityState === "hidden") {
        if (merekam) sembunyiSejak.current = performance.now();
        return;
      }
      if (sembunyiSejak.current !== null && merekam) {
        if (performance.now() - sembunyiSejak.current > SEMBUNYI_MAKS_MS) {
          terputus.current = true;
          setSempatDitinggal(true);
        }
        mintaWakeLock();
      }
      sembunyiSejak.current = null;
    };
    document.addEventListener("visibilitychange", saatBerubah);
    return () => document.removeEventListener("visibilitychange", saatBerubah);
  }, [mintaWakeLock]);

  useEffect(
    () => () => {
      if (rec.current && rec.current.state !== "inactive") {
        rec.current.onstop = null;
        rec.current.stop();
      }
      bersihkan();
      if (urlLama.current) URL.revokeObjectURL(urlLama.current);
    },
    [bersihkan],
  );

  return {
    tahap,
    detik,
    galat,
    hasil,
    wakeLockGagal,
    sempatDitinggal,
    cukupPanjang: detik >= MIN_DETIK,
    tandaTerakhir,
    jumlahTanda,
    mulai,
    berhenti,
    batal,
    tandaiMenunggu,
    ulang,
  };
}
