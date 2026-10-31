import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { Hasil } from "./hasil";

export const metadata = { title: "Umpan balik · Talkly" };

// O5b, O6, O7. Hasil memakai useParams, jadi dibungkus Suspense.
export default function HalamanHasil() {
  return (
    <Suspense fallback={<Memuat />}>
      <Hasil />
    </Suspense>
  );
}
