import type { ReactNode } from "react";

export default function LayoutTerapis({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6">
      <a
        href="#isi-terapis"
        className="sr-only rounded-xl bg-permukaan p-3 text-hijau-tua focus:not-sr-only"
      >
        Lewati ke isi dasbor
      </a>
      <main id="isi-terapis" className="min-w-0">
        {children}
      </main>
    </div>
  );
}
