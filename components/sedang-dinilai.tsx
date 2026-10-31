"use client";

import { useEffect, useState } from "react";
import { Ikon } from "./ikon";

const TAHAP = ["Mengirim rekaman", "Mendengarkan rekaman", "Menyiapkan umpan balik"];

// O5b: tiga tahap pemrosesan dalam satu kartu. Tahap ketiga muncul setelah 4 detik;
// setelah 30 detik muncul keterangan bahwa penilaian lebih lama dari biasanya.
export function SedangDinilai() {
  const [detik, setDetik] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const aktif = detik >= 4 ? 2 : 1;

  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <ol className="divide-y divide-garis overflow-hidden rounded-2xl bg-permukaan shadow-kartu">
        {TAHAP.map((t, i) => {
          const selesai = i < aktif;
          const sedang = i === aktif;
          return (
            <li key={t} className="flex min-h-14 items-center gap-3 px-4 py-3">
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  selesai ? "bg-hijau text-white" : sedang ? "ring-2 ring-inset ring-hijau" : "ring-2 ring-inset ring-garis"
                }`}
              >
                {selesai ? <Ikon nama="centang" ukuran={16} /> : sedang ? <span className="kerangka h-2.5 w-2.5 rounded-full bg-hijau" /> : null}
              </span>
              <span className={`text-[16px] ${selesai || sedang ? "font-semibold" : "text-abu"}`}>{t}</span>
            </li>
          );
        })}
      </ol>
      {detik >= 30 ? (
        <p className="px-1 text-[15px] text-abu">
          Penilaian lebih lama dari biasanya. Anda boleh menutup halaman ini; hasilnya tetap tersimpan dan bisa dibuka lagi.
        </p>
      ) : null}
    </div>
  );
}
