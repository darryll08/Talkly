import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { PesanKeluarga } from "@/components/terapis/pesan-keluarga";
export default function Halaman() {
  return (
    <Suspense fallback={<Memuat />}>
      <PesanKeluarga />
    </Suspense>
  );
}
