import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { KartuAnak } from "./kartu";

export default function HalamanKartu() {
  return <Suspense fallback={<Memuat label="Memuat kartu anak" />}><KartuAnak /></Suspense>;
}
