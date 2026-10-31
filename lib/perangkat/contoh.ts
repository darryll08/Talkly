// Penyedia data contoh untuk NEXT_PUBLIC_PAKAI_CONTOH=1. Memetakan "METODE path" ke lib/kontrak/contoh/.
// Diisi setelah kontrak dikunci (B0.4).

import { pasangContoh, GalatApi, type Endpoint } from "./panggil";

const PETA: Record<string, (data: Record<string, unknown> | undefined) => unknown> = {};

export function pasang() {
  pasangContoh(async (e: Endpoint, data) => {
    const f = PETA[`${e.metode} ${e.path}`];
    if (!f) throw new GalatApi(404, `Belum ada data contoh untuk ${e.metode} ${e.path}.`);
    await new Promise((ok) => setTimeout(ok, 250));
    return f(data);
  });
}
