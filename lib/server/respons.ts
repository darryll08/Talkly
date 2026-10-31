import type { z } from "zod";

// Balasan JSON seragam. Pesan galat berbahasa sehari-hari karena tampil apa adanya di layar.

export function galat(status: number, pesan: string) {
  return Response.json({ pesan }, { status });
}

export function kosong() {
  return new Response(null, { status: 204 });
}

/** Baca body JSON dan validasi dengan skema kontrak; galat 400 bila tidak sesuai. */
export async function bacaBody<S extends z.ZodType>(req: Request, skema: S): Promise<z.output<S> | Response> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return galat(400, "Data yang dikirim tidak terbaca.");
  }
  const hasil = skema.safeParse(json);
  if (!hasil.success) return galat(400, "Data yang dikirim belum lengkap.");
  return hasil.data;
}
