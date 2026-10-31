"use client";

// Pilihan berbentuk pil di atas radio asli.
export function Pil<T extends string>({
  nama,
  pilihan,
  nilai,
  ubah,
  label,
}: {
  nama: string;
  pilihan: readonly { nilai: T; label: string }[];
  nilai: T | null;
  ubah: (nilai: T) => void;
  label: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[15px] font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {pilihan.map((p) => (
          <label
            key={p.nilai}
            className="tekan inline-flex min-h-11 cursor-pointer items-center rounded-full bg-permukaan px-4 text-[15px] font-medium text-foreground ring-1 ring-garis has-[:checked]:bg-hijau has-[:checked]:text-white has-[:checked]:ring-hijau has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hijau"
          >
            <input
              type="radio"
              name={nama}
              value={p.nilai}
              checked={nilai === p.nilai}
              onChange={() => ubah(p.nilai)}
              className="sr-only"
            />
            {p.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
