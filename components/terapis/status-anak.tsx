import type { StatusAnak as Status } from "@/lib/kontrak/api";

const label: Record<Status, string> = { lanjut: "Lanjut", terapis_meninjau: "Terapis meninjau", bahas_minggu_ini: "Bahas minggu ini" };
export function StatusAnak({ status, pemicu }: { status: Status; pemicu?: string | null }) {
  return <div className="space-y-1"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status === "bahas_minggu_ini" ? "bg-oranye-muda text-oranye-tua" : status === "lanjut" ? "bg-hijau-muda text-hijau-tua" : "bg-abu-muda text-foreground"}`}>{label[status]}</span>{pemicu && <p className="text-sm text-abu">{pemicu}</p>}</div>;
}
