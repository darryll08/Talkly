import Image from "next/image";
import Link from "next/link";

// Logo + nama Talkly untuk kepala halaman publik (beranda, masuk, 404).
export function Merek({ terang = false }: { terang?: boolean }) {
  return (
    <Link href="/" className="tekan inline-flex items-center gap-2.5" aria-label="Talkly, beranda">
      <Image src="/logo.svg" alt="" width={36} height={36} className="rounded-[10px]" />
      <span className={`text-[20px] font-bold ${terang ? "text-white" : ""}`}>Talkly</span>
    </Link>
  );
}

/** Kartu pratinjau hasil rekaman: gambaran produk di beranda dan panel masuk. */
export function PratinjauHasil() {
  return (
    <div className="w-full max-w-[340px] space-y-3 rounded-3xl bg-permukaan p-5 text-foreground shadow-angkat">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-abu">Rekaman sore · 1 menit</span>
        <span className="text-[12px] font-semibold text-abu">Selesai</span>
      </div>
      <p className="text-[19px] font-bold leading-snug">Raka bilang &ldquo;mam&rdquo; 3 kali sendiri</p>
      <div className="flex h-10 items-end gap-[3px]" aria-hidden="true">
        {[30, 55, 40, 80, 35, 20, 65, 90, 50, 25, 45, 70, 30, 15, 60, 85, 40, 20, 55, 35].map((t, i) => (
          <span
            key={i}
            style={{ height: `${t}%` }}
            className={`flex-1 rounded-full ${i % 7 === 3 || i === 16 ? "bg-hijau" : "bg-hijau-lembut/40"}`}
          />
        ))}
      </div>
      <p className="text-[14px] leading-snug text-abu">Besok coba tunggu 5 detik sebelum memberi contoh kata.</p>
    </div>
  );
}
