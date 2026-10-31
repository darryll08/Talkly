import type { Kata, PeristiwaAudio, Transkrip, Ucapan } from "./tipe";

// Speech-to-text: ElevenLabs Scribe v2 (diarisasi, cap waktu per kata, bahasa Indonesia),
// cadangan Deepgram Nova-3 bila Scribe gagal atau melewati 20 detik.

const BATAS_MS = 20_000;

export class GagalStt extends Error {}

async function denganBatas<T>(kerja: (sinyal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), BATAS_MS);
  try {
    return await kerja(ctl.signal);
  } finally {
    clearTimeout(t);
  }
}

type KataScribe = {
  text: string;
  start: number;
  end: number;
  type: "word" | "spacing" | "audio_event";
  speaker_id?: string;
  logprob?: number;
};

export function normalkanScribe(json: { words?: KataScribe[] }): Transkrip {
  const kata: Kata[] = [];
  const peristiwa: PeristiwaAudio[] = [];
  for (const w of json.words ?? []) {
    if (w.type === "word") {
      kata.push({
        teks: w.text.trim(),
        t_mulai: w.start,
        t_selesai: w.end,
        pembicara: w.speaker_id ?? "speaker_0",
        keyakinan: typeof w.logprob === "number" ? Math.exp(w.logprob) : null,
      });
    } else if (w.type === "audio_event") {
      const t = w.text.toLowerCase();
      const jenis = /music|musik|song|singing/.test(t)
        ? "musik"
        : /tv|television|televisi|broadcast/.test(t)
          ? "tv"
          : /laugh|tawa/.test(t)
            ? "tawa"
            : "lainnya";
      peristiwa.push({ jenis, t_mulai: w.start, t_selesai: w.end });
    }
  }
  return { penyedia: "scribe", kata, peristiwa };
}

export async function scribe(audio: Blob): Promise<Transkrip> {
  const kunci = process.env.ELEVENLABS_API_KEY;
  if (!kunci) throw new GagalStt("ELEVENLABS_API_KEY belum diisi");
  const form = new FormData();
  form.append("model_id", "scribe_v2");
  form.append("file", audio, "rekaman.webm");
  form.append("language_code", "ind");
  form.append("diarize", "true");
  form.append("tag_audio_events", "true");
  form.append("timestamps_granularity", "word");
  const res = await denganBatas((signal) =>
    fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": kunci }, body: form, signal }),
  );
  if (!res.ok) throw new GagalStt(`Scribe ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return normalkanScribe(await res.json());
}

type KataDeepgram = { word: string; punctuated_word?: string; start: number; end: number; confidence?: number; speaker?: number };

export function normalkanDeepgram(json: {
  results?: { channels?: { alternatives?: { words?: KataDeepgram[] }[] }[] };
}): Transkrip {
  const words = json.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
  return {
    penyedia: "deepgram",
    kata: words.map((w) => ({
      teks: (w.punctuated_word ?? w.word).trim(),
      t_mulai: w.start,
      t_selesai: w.end,
      pembicara: `speaker_${w.speaker ?? 0}`,
      keyakinan: w.confidence ?? null,
    })),
    peristiwa: [],
  };
}

export async function deepgram(audio: Blob): Promise<Transkrip> {
  const kunci = process.env.DEEPGRAM_API_KEY;
  if (!kunci) throw new GagalStt("DEEPGRAM_API_KEY belum diisi");
  const url = "https://api.deepgram.com/v1/listen?model=nova-3&language=id&diarize=true&punctuate=true&smart_format=true";
  const res = await denganBatas((signal) =>
    fetch(url, {
      method: "POST",
      headers: { Authorization: `Token ${kunci}`, "Content-Type": audio.type || "audio/webm" },
      body: audio,
      signal,
    }),
  );
  if (!res.ok) throw new GagalStt(`Deepgram ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return normalkanDeepgram(await res.json());
}

/** Scribe lalu Deepgram. Melempar GagalStt bila keduanya gagal (proses lalu memakai cadangan K11). */
export async function transkripsi(audio: Blob): Promise<Transkrip> {
  const galat: string[] = [];
  for (const penyedia of [scribe, deepgram]) {
    try {
      return await penyedia(audio);
    } catch (e) {
      galat.push((e as Error).message);
    }
  }
  throw new GagalStt(galat.join(" | "));
}

/**
 * Kata → ucapan: kata berurutan dari pembicara yang sama digabung, dipisah bila ada jeda > 0,8 detik
 * atau kata sebelumnya diakhiri tanda tanya.
 */
export function keUcapan(t: Transkrip, jedaPisah = 0.8): Ucapan[] {
  const hasil: Ucapan[] = [];
  for (const k of [...t.kata].sort((a, b) => a.t_mulai - b.t_mulai)) {
    const akhir = hasil.at(-1);
    const sambung =
      akhir &&
      akhir.pembicara === k.pembicara &&
      k.t_mulai - akhir.t_selesai <= jedaPisah &&
      !akhir.teks.trimEnd().endsWith("?");
    if (sambung) {
      akhir.kata.push(k);
      akhir.t_selesai = k.t_selesai;
      akhir.teks = `${akhir.teks} ${k.teks}`;
    } else {
      hasil.push({ pembicara: k.pembicara, t_mulai: k.t_mulai, t_selesai: k.t_selesai, teks: k.teks, kata: [k] });
    }
  }
  return hasil;
}
