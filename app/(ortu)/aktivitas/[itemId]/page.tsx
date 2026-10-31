import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { KartuAktivitas } from "./kartu";

// O4 Kartu aktivitas. KartuAktivitas memakai useParams, jadi dibungkus Suspense.
export default function HalamanAktivitas() {
  return (
    <Suspense fallback={<Memuat />}>
      <KartuAktivitas />
    </Suspense>
  );
}
