import { Suspense, type ReactNode } from "react";
import { TopbarPanel } from "@/components/topbar-panel";
import { SisiTerapis } from "@/components/terapis/sisi-terapis";

// Layar lebar: sidebar di kiri. Layar sempit: kepala atas seperti panel admin.
export default function LayoutTerapis({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex">
      <Suspense>
        <SisiTerapis />
      </Suspense>
      <div className="min-w-0 flex-1">
        {/* Pembungkus ikut sticky: sticky di TopbarPanel saja terbatas pada pembungkus ini dan ikut tergulir. */}
        <div className="sticky top-0 z-30 lg:hidden">
          <TopbarPanel panel="Dasbor terapis" sebagai="terapis" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          <a href="#isi-terapis" className="sr-only rounded-xl bg-permukaan p-3 text-hijau-tua focus:not-sr-only">
            Lewati ke isi dasbor
          </a>
          <main id="isi-terapis" className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
