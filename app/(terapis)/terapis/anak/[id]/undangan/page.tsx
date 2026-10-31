import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { UndanganKeluarga } from "@/components/terapis/undangan";
export default function Halaman() {
  return (
    <Suspense fallback={<Memuat />}>
      <UndanganKeluarga />
    </Suspense>
  );
}
