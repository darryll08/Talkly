import { denganAkses } from "@/lib/server/akses";
import { galat } from "@/lib/server/respons";
import { db } from "@/lib/server/supabase";

// Memeriksa Supabase, ElevenLabs, OpenAI, dan kunci push tanpa memakai kredit.
// Tidak pernah mengembalikan isi kunci. Terbuka untuk terapis, atau untuk siapa pun bila DEMO=1.

type Cek = { ok: boolean; pesan: string };

export const GET = denganAkses(["terapis", "publik"], async (_req, { saya }) => {
  if (saya.jenis === "publik" && process.env.DEMO !== "1") return galat(401, "Silakan masuk dulu.");
  const [supabase, elevenlabs, openai] = await Promise.all([cekSupabase(), cekElevenLabs(), cekOpenAI()]);
  const push: Cek = {
    ok: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    pesan: `kunci publik ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "ada" : "kosong"}, kunci pribadi ${process.env.VAPID_PRIVATE_KEY ? "ada" : "kosong"}`,
  };
  return Response.json({ supabase, elevenlabs, openai, push });
});

async function cekSupabase(): Promise<Cek> {
  try {
    // Tanpa head: true, karena galat "tabel tidak ada" ikut hilang bersama body.
    const { data, error } = await db().from("klinik").select("id").limit(1);
    if (error) return { ok: false, pesan: error.message };
    return { ok: true, pesan: `tabel klinik terbaca (${data.length ? "ada isi" : "kosong"})` };
  } catch (e) {
    return { ok: false, pesan: (e as Error).message };
  }
}

// Permintaan tanpa berkas: kunci sah dibalas galat validasi, bukan 401, dan tidak memakai kredit.
async function cekElevenLabs(): Promise<Cek> {
  const kunci = process.env.ELEVENLABS_API_KEY;
  if (!kunci) return { ok: false, pesan: "ELEVENLABS_API_KEY belum diisi" };
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": kunci },
      body: new FormData(),
    });
    const isi = await res.text();
    // Balasan 400 "invalid_api_key" muncul bila yang ditempel ID kunci, bukan kuncinya.
    if (res.status === 401 || res.status === 403 || /invalid_api_key|authentication/i.test(isi)) {
      return { ok: false, pesan: `kunci ditolak (${res.status})` };
    }
    return { ok: true, pesan: `kunci diterima (status uji ${res.status})` };
  } catch (e) {
    return { ok: false, pesan: (e as Error).message };
  }
}

async function cekOpenAI(): Promise<Cek> {
  const kunci = process.env.OPENAI_API_KEY;
  if (!kunci) return { ok: false, pesan: "OPENAI_API_KEY belum diisi" };
  try {
    const res = await fetch("https://api.openai.com/v1/models/gpt-6-luna", {
      headers: { Authorization: `Bearer ${kunci}` },
    });
    if (res.status === 401) return { ok: false, pesan: "kunci ditolak (401)" };
    if (!res.ok) return { ok: false, pesan: `model gpt-6-luna tidak tersedia (${res.status})` };
    return { ok: true, pesan: "kunci diterima, gpt-6-luna tersedia" };
  } catch (e) {
    return { ok: false, pesan: (e as Error).message };
  }
}
