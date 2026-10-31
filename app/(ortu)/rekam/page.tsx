import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { Perekam } from "./perekam";

export const metadata = { title: "Rekam 1 Menit · Talkly" };

// O5 Rekam 1 Menit. Perekam memakai useSearchParams, jadi dibungkus Suspense.
export default function HalamanRekam() {
  return (
    <Suspense fallback={<Memuat />}>
      <Perekam />
    </Suspense>
  );
}
