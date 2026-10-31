import Link from "next/link";
import { kartu, kolomOrtu, tombolUtama, judulHalaman } from "@/lib/gaya";

export const metadata = { title: "Belum tersambung · Talkly" };

export default function Offline() {
  return (
    <main className={`${kolomOrtu} flex min-h-dvh flex-col justify-center gap-6 py-10`}>
      <div className="muncul space-y-3">
        <p className="text-[13px] font-medium text-abu">Talkly</p>
        <h1 className={judulHalaman}>Belum tersambung</h1>
        <p className="text-[17px] leading-relaxed text-abu">
          Halaman ini perlu internet. Kartu aktivitas yang pernah Anda buka tetap bisa dibaca, dan rekaman yang belum
          terkirim disimpan di ponsel lalu dikirim otomatis saat sinyal kembali.
        </p>
      </div>
      <div className={kartu}>
        <Link href="/hari-ini" className={tombolUtama}>
          Buka Hari ini
        </Link>
      </div>
    </main>
  );
}
