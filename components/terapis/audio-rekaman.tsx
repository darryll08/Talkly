"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari, GalatApi } from "@/lib/perangkat/panggil";
import * as g from "@/lib/gaya";

export function AudioRekaman({
  id,
  mulai = 0,
}: {
  id: string;
  mulai?: number;
}) {
  const router = useRouter();
  const [sumber, setSumber] = useState<{ url: string; kunci: number } | null>(
    null,
  );
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  async function putar() {
    setSibuk(true);
    setGalat("");
    try {
      const hasil = await panggil(API.rekamanAudio, { id });
      setSumber({ url: hasil.url, kunci: Date.now() });
    } catch (error) {
      if (error instanceof GalatApi && error.status === 401)
        router.replace("/terapis/masuk");
      setGalat(
        error instanceof GalatApi && error.status === 403
          ? "Keluarga belum mengizinkan rekaman ini didengar."
          : pesanDari(error),
      );
    } finally {
      setSibuk(false);
    }
  }
  return (
    <div className="w-full space-y-2">
      <button className={g.tombolTeks} disabled={sibuk} onClick={putar}>
        {sibuk
          ? "Meminta audio…"
          : mulai
            ? `Putar dari ${mulai.toFixed(1)} detik`
            : "Putar rekaman"}
      </button>
      {galat && (
        <p role="alert" className={g.kotakGalat}>
          {galat}
        </p>
      )}
      {sumber && (
        <audio
          key={sumber.kunci}
          className="w-full"
          src={sumber.url}
          controls
          controlsList="nodownload"
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = Math.min(
              mulai,
              Number.isFinite(e.currentTarget.duration)
                ? e.currentTarget.duration
                : mulai,
            );
          }}
          onError={() =>
            setGalat(
              "Audio belum dapat diputar atau tautannya sudah kedaluwarsa. Minta audio lagi.",
            )
          }
        />
      )}
    </div>
  );
}
