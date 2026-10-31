// Satu-satunya pintu ke /api (K3). Memvalidasi request dan response dengan skema Zod endpoint di lib/kontrak/api.ts.
// Bila NEXT_PUBLIC_PAKAI_CONTOH=1, data diambil dari lib/kontrak/contoh/ tanpa jaringan.

import type { z } from "zod";

/** Bentuk satu entri endpoint di lib/kontrak/api.ts yang dipakai panggil(). */
export type Endpoint = {
  metode: "GET" | "POST" | "PATCH" | "DELETE";
  path: string; // misal "/api/rekaman/:id"
  request?: z.ZodType;
  response?: z.ZodType; // tidak ada untuk 204
};

type Req<E extends Endpoint> = E["request"] extends z.ZodType ? z.input<E["request"]> : undefined;
type Res<E extends Endpoint> = E["response"] extends z.ZodType ? z.output<E["response"]> : null;

export class GalatApi extends Error {
  constructor(
    public status: number,
    pesan: string,
  ) {
    super(pesan);
    this.name = "GalatApi";
  }
}

export const PESAN_PUTUS = "Belum tersambung. Periksa internet lalu coba lagi.";
const PESAN_UMUM = "Ada yang belum berjalan. Coba lagi sebentar lagi.";

export const PAKAI_CONTOH = process.env.NEXT_PUBLIC_PAKAI_CONTOH === "1";

/** Isi `:param` di path dari data, sisanya untuk body atau query. */
function isiPath(path: string, data: Record<string, unknown> | undefined) {
  const sisa: Record<string, unknown> = { ...(data ?? {}) };
  const url = path.replace(/:([a-zA-Z_]+)/g, (_, k: string) => {
    const v = sisa[k];
    delete sisa[k];
    if (v === undefined || v === null) throw new GalatApi(400, `Parameter ${k} belum diisi.`);
    return encodeURIComponent(String(v));
  });
  return { url, sisa };
}

async function bacaPesan(res: Response) {
  try {
    const j = (await res.json()) as { pesan?: string; error?: string; message?: string };
    return j.pesan || j.error || j.message || null;
  } catch {
    return null;
  }
}

type PenyediaContoh = (e: Endpoint, data: Record<string, unknown> | undefined) => Promise<unknown>;
let penyediaContoh: PenyediaContoh | null = null;
/** Dipasang oleh lib/perangkat/contoh.ts agar data contoh tidak ikut terbundel saat tidak dipakai. */
export function pasangContoh(p: PenyediaContoh) {
  penyediaContoh = p;
}

export async function panggil<E extends Endpoint>(endpoint: E, data?: Req<E>): Promise<Res<E>> {
  const masukan = endpoint.request ? (endpoint.request.parse(data) as Record<string, unknown>) : (data as Record<string, unknown> | undefined);

  if (PAKAI_CONTOH) {
    if (!penyediaContoh) {
      const m = await import("./contoh");
      m.pasang();
    }
    const contoh = await penyediaContoh!(endpoint, masukan);
    return (endpoint.response ? endpoint.response.parse(contoh) : null) as Res<E>;
  }

  const { url, sisa } = isiPath(endpoint.path, masukan);
  let alamat = url;
  const init: RequestInit = { method: endpoint.metode, credentials: "same-origin", headers: {} };
  if (endpoint.metode === "GET" || endpoint.metode === "DELETE") {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sisa)) if (v !== undefined && v !== null) q.set(k, String(v));
    const qs = q.toString();
    if (qs) alamat += (alamat.includes("?") ? "&" : "?") + qs;
  } else if (Object.keys(sisa).length > 0) {
    init.body = JSON.stringify(sisa);
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(alamat, init);
  } catch {
    throw new GalatApi(0, PESAN_PUTUS);
  }
  if (!res.ok) throw new GalatApi(res.status, (await bacaPesan(res)) ?? PESAN_UMUM);
  if (res.status === 204 || !endpoint.response) return null as Res<E>;

  const json = await res.json().catch(() => {
    throw new GalatApi(res.status, PESAN_UMUM);
  });
  const hasil = endpoint.response.safeParse(json);
  if (!hasil.success) {
    console.error(`Respons ${endpoint.metode} ${endpoint.path} tidak sesuai kontrak`, hasil.error);
    throw new GalatApi(500, "Data dari server tidak sesuai kontrak.");
  }
  return hasil.data as Res<E>;
}

/** Unggah multipart rekaman (dipakai antrean). Status dikembalikan apa adanya agar antrean memutuskan. */
export async function unggahMultipart(
  path: string,
  form: FormData,
): Promise<{ status: number; json: unknown; pesan: string | null }> {
  if (PAKAI_CONTOH) {
    return { status: 202, json: { rekaman_id: "00000000-0000-4000-8000-000000000006" }, pesan: null };
  }
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", body: form, credentials: "same-origin" });
  } catch {
    return { status: 0, json: null, pesan: PESAN_PUTUS };
  }
  const salinan = res.clone();
  const json = await res.json().catch(() => null);
  return { status: res.status, json, pesan: res.ok ? null : await bacaPesan(salinan) };
}

/** Cek keberadaan berkas statis (misal rekaman cadangan demo). */
export async function adaBerkas(path: string) {
  try {
    const res = await fetch(path, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export function pesanDari(e: unknown) {
  if (e instanceof GalatApi) return e.message;
  return PESAN_UMUM;
}
