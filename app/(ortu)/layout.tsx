import { Suspense } from "react";
import { BingkaiOrtu } from "@/components/bingkai-ortu";

// Satu kolom max-w-md untuk semua layar orang tua, dengan navigasi bawah.
export default function LayoutOrtu({ children }: LayoutProps<"/">) {
  return (
    <Suspense>
      <BingkaiOrtu>{children}</BingkaiOrtu>
    </Suspense>
  );
}
