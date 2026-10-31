"use client";

// Sakelar geser ala iOS 51×31 di atas checkbox asli, agar tetap bisa dipakai keyboard dan pembaca layar.
export function Sakelar({
  nyala,
  ubah,
  label,
  keterangan,
  nonaktif = false,
  id,
}: {
  nyala: boolean;
  ubah: (nyala: boolean) => void;
  label: React.ReactNode;
  keterangan?: React.ReactNode;
  nonaktif?: boolean;
  id?: string;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-start gap-3 px-4 py-3 has-[:disabled]:cursor-default">
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold">{label}</span>
        {keterangan ? <span className="mt-0.5 block text-[14px] leading-snug text-abu">{keterangan}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex h-[31px] w-[51px] shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={nyala}
          disabled={nonaktif}
          onChange={(e) => ubah(e.target.checked)}
          className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-default"
        />
        <span className="absolute inset-0 rounded-full bg-abu/25 transition-colors duration-300 ease-pegas peer-checked:bg-hijau peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-hijau peer-disabled:opacity-50" />
        <span className="pointer-events-none absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-transform duration-300 ease-pegas peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
