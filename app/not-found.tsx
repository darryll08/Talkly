import Link from "next/link";
import * as g from "@/lib/gaya";
import { Merek } from "@/components/merek";

export default function TidakDitemukan() {
  return (
    <main className={`${g.kolomOrtu} flex min-h-dvh flex-col gap-10 pb-10 pt-[calc(env(safe-area-inset-top)+1.5rem)]`}>
      <Merek />
      <section className="my-auto space-y-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-hijau-tua">Halaman tidak ditemukan</p>
        <h1 className={g.judulHalaman}>Halaman ini tidak ada.</h1>
        <p className="text-[16px] leading-relaxed text-abu">Tautannya mungkin salah ketik atau sudah tidak dipakai.</p>
        <Link href="/" className={g.tombolUtama}>
          Kembali ke Talkly
        </Link>
      </section>
    </main>
  );
}
