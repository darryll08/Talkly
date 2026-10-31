"use client";

import { useEffect, useRef, useState } from "react";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { panggil, pesanDari } from "@/lib/perangkat/panggil";
import { useData } from "@/lib/perangkat/use-data";
import { useSaya } from "@/lib/perangkat/saya";
import { KepalaHijau } from "@/components/kepala-hijau";
import { Gelembung } from "@/components/gelembung";
import { Memuat } from "@/components/memuat";
import { Ikon } from "@/components/ikon";

const waktu = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Pesan antara keluarga dan terapis, tetap di Talkly (bukan WhatsApp).
export default function Pesan() {
  const { data, galat, muatUlang } = useData(API.pesanLihat);
  const { data: saya } = useSaya();
  const namaSaya = saya?.anggota.nama;
  const terapis = saya?.anak.terapis.nama ?? "terapis";
  const [isi, setIsi] = useState("");
  const [kirim, setKirim] = useState(false);
  const [galatKirim, setGalatKirim] = useState<string | null>(null);
  const akhir = useRef<HTMLDivElement>(null);

  const jumlah = data?.pesan.length ?? 0;
  useEffect(() => {
    akhir.current?.scrollIntoView({ block: "end" });
  }, [jumlah]);

  async function kirimPesan(e: React.FormEvent) {
    e.preventDefault();
    if (!isi.trim()) return;
    setKirim(true);
    setGalatKirim(null);
    try {
      await panggil(API.pesanKirim, { isi: isi.trim() });
      setIsi("");
      muatUlang();
    } catch (err) {
      setGalatKirim(pesanDari(err));
    } finally {
      setKirim(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col">
      <KepalaHijau kembali="/hari-ini" atas="Pesan" judul={terapis} rapat />
      <div className="h-4" />
      {galat && !data ? <p className={g.kotakGalat}>{galat}</p> : null}
      {!data && !galat ? <Memuat /> : null}
      {data ? (
        <div className="flex-1 space-y-3 pb-4">
          <p className="text-center text-[13px] text-abu">Terapis membalas pada jam kerja klinik.</p>
          {data.pesan.length === 0 ? (
            <p className="py-10 text-center text-[15px] text-abu">Belum ada pesan.</p>
          ) : (
            data.pesan.map((p) => (
              <Gelembung key={p.id} milikSendiri={p.dari === "keluarga" && p.nama === namaSaya} nama={p.dari === "keluarga" && p.nama === namaSaya ? "Anda" : p.nama} waktu={waktu(p.dibuat)} konteks={p.konteks}>
                {p.isi}
              </Gelembung>
            ))
          )}
          <div ref={akhir} />
        </div>
      ) : null}

      <form
        onSubmit={kirimPesan}
        className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] -mx-4 border-t border-garis bg-background/90 px-4 py-2 backdrop-blur-xl"
      >
        {galatKirim ? <p className={`${g.kotakGalat} mb-2`}>{galatKirim}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            rows={1}
            placeholder="Tulis pesan"
            aria-label="Tulis pesan"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-[22px] border border-garis bg-permukaan px-4 py-2.5 text-[16px] outline-none focus:border-hijau focus:ring-4 focus:ring-hijau/15"
          />
          <button
            type="submit"
            disabled={!isi.trim() || kirim}
            aria-label="Kirim"
            className="tekan inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hijau text-white disabled:bg-abu/30"
          >
            <Ikon nama="kirim" ukuran={22} />
          </button>
        </div>
      </form>
    </div>
  );
}
