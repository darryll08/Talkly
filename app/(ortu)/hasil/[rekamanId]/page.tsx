import { Suspense } from "react";
import { Memuat } from "@/components/memuat";
import { Hasil } from "./hasil";

export const metadata = { title: "Umpan balik · Talkly" };

// O5b, O6, O7. rekamanId dibaca di server di dalam Suspense, lalu diteruskan ke Hasil.
export default function HalamanHasil({ params }: PageProps<"/hasil/[rekamanId]">) {
  return (
    <Suspense fallback={<Memuat />}>
      {params.then(({ rekamanId }) => (
        <Hasil rekamanId={rekamanId} />
      ))}
    </Suspense>
  );
}
