"use client";
import { useParams } from "next/navigation";
import { API } from "@/lib/kontrak/api";
import { useData } from "@/lib/perangkat/use-data";
import { Memuat } from "@/components/memuat";
import { ProgramForm } from "./program-form";
import * as g from "@/lib/gaya";

export function ProgramBaru() {
  const bank = useData(API.aktivitasBank, undefined, {
    masuk: "/terapis/masuk",
  });
  if (bank.galat)
    return (
      <p role="alert" className={g.kotakGalat}>
        {bank.galat}
      </p>
    );
  if (!bank.data) return <Memuat />;
  return (
    <section className="space-y-6">
      <h1 className={g.judulHalaman}>Program anak baru</h1>
      <ProgramForm bank={bank.data} />
    </section>
  );
}
export function ProgramAnak() {
  const { id } = useParams<{ id: string }>();
  const bank = useData(API.aktivitasBank, undefined, {
    masuk: "/terapis/masuk",
  });
  const anak = useData(API.anakLihat, { id }, { masuk: "/terapis/masuk" });
  if (bank.galat || anak.galat)
    return (
      <p role="alert" className={g.kotakGalat}>
        {bank.galat || anak.galat}
      </p>
    );
  if (!bank.data || !anak.data) return <Memuat />;
  if (anak.data.id !== id)
    return (
      <p className={g.kotakGalat}>
        Program anak ini belum tersedia pada penyedia data.
      </p>
    );
  return (
    <section className="space-y-6">
      <h1 className={g.judulHalaman}>Program {anak.data.nama}</h1>
      <ProgramForm key={id} anak={anak.data} bank={bank.data} />
    </section>
  );
}
