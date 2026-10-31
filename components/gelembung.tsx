// Gelembung chat. Milik sendiri: hijau di kanan, sudut kanan bawah lancip. Pihak lain: putih di kiri.
export function Gelembung({
  milikSendiri,
  nama,
  waktu,
  konteks,
  children,
}: {
  milikSendiri: boolean;
  nama?: string;
  waktu?: string;
  konteks?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col ${milikSendiri ? "items-end" : "items-start"}`}>
      {nama || waktu ? (
        <span className="mb-1 px-1 text-xs text-abu">
          {nama}
          {nama && waktu ? " · " : ""}
          {waktu}
        </span>
      ) : null}
      <div
        className={`max-w-[82%] whitespace-pre-wrap break-words px-4 py-2.5 text-[16px] leading-snug ${
          milikSendiri
            ? "rounded-[20px] rounded-br-md bg-hijau text-white"
            : "rounded-[20px] rounded-bl-md bg-permukaan text-foreground shadow-kartu"
        }`}
      >
        {konteks ? (
          <span className={`mb-1 block text-xs font-semibold ${milikSendiri ? "text-white/80" : "text-oranye-tua"}`}>
            {konteks}
          </span>
        ) : null}
        {children}
      </div>
    </div>
  );
}
