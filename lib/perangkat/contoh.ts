// Penyedia data contoh untuk NEXT_PUBLIC_PAKAI_CONTOH=1. Memetakan "METODE path" ke data contoh.
// Sementara memakai lib/perangkat/sementara/contoh.ts sampai lib/kontrak/contoh/ ada.

import { pasangContoh, GalatApi, type Endpoint } from "./panggil";
import { PETA_CONTOH } from "./sementara/contoh";

export function pasang() {
  pasangContoh(async (e: Endpoint, data) => {
    const f = PETA_CONTOH[`${e.metode} ${e.path}`];
    if (!f) throw new GalatApi(404, `Belum ada data contoh untuk ${e.metode} ${e.path}.`);
    await new Promise((ok) => setTimeout(ok, 300));
    try {
      return f(data);
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500;
      throw new GalatApi(status, err instanceof Error ? err.message : "Galat data contoh.");
    }
  });
}
