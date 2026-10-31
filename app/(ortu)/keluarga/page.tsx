"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as g from "@/lib/gaya";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { useSaya } from "@/lib/perangkat/saya";
import { Memuat } from "@/components/memuat";
import { Inisial } from "@/components/inisial";
import { Ikon } from "@/components/ikon";

const PERAN: Record<string, string> = { ibu: "Ibu", ayah: "Ayah", pengasuh: "Pengasuh", nenek: "Nenek", kakek: "Kakek", lainnya: "Keluarga" };

// O11 Keluarga minggu ini: hanya untuk pengelola keluarga. Tanpa skor atau peringkat.
export default function Keluarga() {
  const router = useRouter();
  const { data: saya } = useSaya();
  const pengelola = saya?.anggota.pengelola;
  const { data, galat } = useData(API.keluargaMingguIni, undefined, { aktif: pengelola === true });

  useEffect(() => {
    if (pengelola === false) router.replace("/hari-ini");
  }, [pengelola, router]);

  if (galat && !data) return <div className={`${g.kotakGalat} mt-6`}>{galat}</div>;
  if (!data || !pengelola) return <Memuat />;

  return (
    <div className="muncul space-y-5 pt-6">
      <header className="space-y-1">
        <p className={g.labelAtas}>
          Minggu mulai {new Date(data.minggu_mulai).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
        </p>
        <h1 className={g.judulHalaman}>Keluarga minggu ini</h1>
      </header>

      <ul className="space-y-3">
        {data.anggota.map((a) => {
          const aktif = a.hari_aktif;
          return (
            <li key={a.id} className={`${g.kartu} space-y-3`}>
              <div className="flex items-center gap-3">
                <Inisial nama={a.nama} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {a.nama}
                    {a.saya ? <span className="font-normal text-abu"> (Anda)</span> : null}
                  </p>
                  <p className="text-[14px] text-abu">{PERAN[a.peran]}</p>
                </div>
                <span className="text-[15px] font-semibold tabular-nums text-hijau-tua">{aktif}/7</span>
              </div>
              <div className="flex gap-2" role="img" aria-label={`Aktif ${aktif} dari 7 hari`}>
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i} className={`h-3 w-3 rounded-full ${i < aktif ? "bg-hijau" : "bg-abu-muda"}`} />
                ))}
              </div>
              <p className="text-[15px] leading-snug">{a.kalimat}</p>
              {a.aktivitas.length > 0 ? (
                <p className="text-[14px] text-abu">{a.aktivitas.map((x) => `${x.judul} (${x.kali}×)`).join(" · ")}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {data.anggota.length < 4 ? (
        <Link href="/profil#undang" className={g.tombolKedua}>
          <Ikon nama="tambah" /> Undang pengasuh
        </Link>
      ) : null}
    </div>
  );
}
