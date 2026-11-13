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

/** Pratinjau O3: kemajuan aktivitas hari ini dalam cincin, gaya kartu "Today's progress". */
export function PratinjauHariIni() {
  const keliling = 2 * Math.PI * 22;
  return (
    <div className="w-full max-w-[300px] space-y-4 rounded-3xl bg-permukaan p-5 text-foreground shadow-angkat">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-abu">Hari ini · Latihan Raka</p>
          <p className="text-[18px] font-bold leading-snug">2 dari 3 aktivitas</p>
        </div>
        <svg viewBox="0 0 56 56" className="size-14 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="28" cy="28" r="22" fill="none" stroke="var(--abu-muda)" strokeWidth="7" />
          <circle
            cx="28"
            cy="28"
            r="22"
            fill="none"
            stroke="var(--hijau)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${keliling * 0.66} ${keliling}`}
          />
        </svg>
      </div>
      <ul className="space-y-2 text-[14px]">
        {[
          ["Main bebek sebelum mandi", true],
          ["Minta lagi saat makan", true],
          ["Buka tutup kotak mainan", false],
        ].map(([judul, selesai]) => (
          <li key={String(judul)} className="flex items-center gap-2.5 rounded-xl bg-background px-3 py-2">
            <span
              className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${
                selesai ? "bg-hijau text-white" : "ring-2 ring-inset ring-garis"
              }`}
            >
              {selesai ? (
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              ) : null}
            </span>
            <span className={selesai ? "text-abu line-through decoration-abu/40" : "font-semibold"}>{judul}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pratinjau O10: jeda menunggu per minggu sebagai grafik pil. */
export function PratinjauJeda() {
  const minggu = [2.1, 3.0, 3.8];
  return (
    <div className="w-full max-w-[240px] space-y-3 rounded-3xl bg-permukaan p-5 text-foreground shadow-angkat">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-medium text-abu">Jeda menunggu</p>
          <p className="font-judul text-[32px] font-extrabold leading-none text-hijau-tua">
            3,8<span className="ml-1 font-sans text-[14px] font-semibold">dtk</span>
          </p>
        </div>
        <span className="rounded-full bg-hijau-muda px-2 py-0.5 text-[13px] font-bold text-hijau-tua">+1,7</span>
      </div>
      <div className="flex h-24 items-stretch gap-3" aria-hidden="true">
        {minggu.map((m, i) => (
          <div key={m} className="garis-miring flex flex-1 items-end rounded-full">
            <div
              className={`relative w-full rounded-full ${i === minggu.length - 1 ? "bg-hijau-tua" : "bg-hijau-lembut"}`}
              style={{ height: `${(m / 4.6) * 100}%` }}
            >
              <span className="absolute inset-x-0 top-1.5 mx-auto block size-2 rounded-full bg-white/90" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kartu pratinjau hasil rekaman: gambaran produk di beranda dan panel masuk. */
export function PratinjauHasil() {
  return (
    <div className="w-full max-w-[340px] space-y-3 rounded-3xl bg-permukaan p-5 text-foreground shadow-angkat">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-abu">Rekaman sore · 1 menit</span>
        <span className="text-[13px] font-semibold text-abu">Selesai</span>
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
