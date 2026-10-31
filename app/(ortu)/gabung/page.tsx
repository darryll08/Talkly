import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { Gabung } from "./gabung";

export const metadata = { title: "Gabung · Talkly" };

// O1 dan O1b Gabung. Kode dari ?kode= (hasil pindai QR) atau diketik.
export default function HalamanGabung() {
  return (
    <Suspense fallback={<Memuat />}>
      <Gabung />
    </Suspense>
  );
}
