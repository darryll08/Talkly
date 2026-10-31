"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// QR dari teks (tautan undangan). Digambar di ponsel, tanpa layanan luar.
export function KodeQr({ teks, ukuran = 200, label }: { teks: string; ukuran?: number; label: string }) {
  const [svg, setSvg] = useState<{ teks: string; isi: string } | null>(null);

  useEffect(() => {
    let batal = false;
    QRCode.toString(teks, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1f2a28", light: "#ffffff" } })
      .then((isi) => {
        if (!batal) setSvg({ teks, isi });
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [teks]);

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: ukuran, height: ukuran }}
      className="overflow-hidden rounded-xl bg-white p-2 ring-1 ring-garis [&>svg]:h-full [&>svg]:w-full"
    >
      {svg && svg.teks === teks ? (
        <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg.isi }} />
      ) : (
        <div className="kerangka h-full w-full" />
      )}
    </div>
  );
}
