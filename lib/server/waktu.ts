// Tanggal dihitung dalam WIB (UTC+7), karena "hari ini" keluarga mengikuti jam Indonesia barat.

const WIB_MS = 7 * 3600_000;

/** yyyy-mm-dd hari ini (WIB), atau `hariLalu` hari sebelumnya. */
export function tanggalWib(hariLalu = 0, dari: Date = new Date()): string {
  return new Date(dari.getTime() + WIB_MS - hariLalu * 86_400_000).toISOString().slice(0, 10);
}

/** yyyy-mm-dd Senin minggu ini (WIB). */
export function seninWib(dari: Date = new Date()): string {
  const wib = new Date(dari.getTime() + WIB_MS);
  wib.setUTCDate(wib.getUTCDate() - ((wib.getUTCDay() + 6) % 7));
  return wib.toISOString().slice(0, 10);
}

/** Awal hari WIB dari yyyy-mm-dd sebagai ISO UTC, untuk filter kolom timestamptz. */
export function awalHariWib(tanggal: string): string {
  return new Date(Date.parse(`${tanggal}T00:00:00Z`) - WIB_MS).toISOString();
}
