import type { KandidatSuaraAnak } from "@/lib/kontrak/rekaman";
import type { Rentang, Ucapan } from "./tipe";

// Menentukan perekam, suara anak, dan dewasa lain dari label pembicara (proposal 4.1).
// Perekam = pembicara dengan ucapan terbanyak: perekam sering bicara pendek-pendek, sedangkan dewasa lain
// yang menimpali bisa bicara panjang sehingga jumlah katanya lebih banyak.

const KATA_PER_UCAPAN_ANAK = 2.5;

export type Peran = {
  perekam: string | null;
  anak: string[];
  dewasa_lain: string[];
  suara_anak: Rentang[];
  sumber_suara_anak: "label" | "celah_hening" | "tidak_ada";
};

export function tentukanPeran(ucapan: Ucapan[], kandidat: KandidatSuaraAnak[] = []): Peran {
  const per = new Map<string, { ucapan: number; kata: number }>();
  for (const u of ucapan) {
    const s = per.get(u.pembicara) ?? { ucapan: 0, kata: 0 };
    s.ucapan += 1;
    s.kata += u.kata.length;
    per.set(u.pembicara, s);
  }
  const urut = [...per.entries()].sort((a, b) => b[1].ucapan - a[1].ucapan || b[1].kata - a[1].kata);
  const perekam = urut[0]?.[0] ?? null;

  const anak: string[] = [];
  const dewasa: string[] = [];
  for (const [p, s] of urut.slice(1)) (s.kata / s.ucapan <= KATA_PER_UCAPAN_ANAK ? anak : dewasa).push(p);

  if (anak.length > 0) {
    const suara = ucapan.filter((u) => anak.includes(u.pembicara)).map(({ t_mulai, t_selesai }) => ({ t_mulai, t_selesai }));
    return { perekam, anak, dewasa_lain: dewasa, suara_anak: suara, sumber_suara_anak: "label" };
  }

  // Cadangan: suara bernada tinggi dari ponsel yang jatuh di celah hening (tidak bertumpuk dengan ucapan dewasa).
  const dewasaSemua = ucapan.filter((u) => !anak.includes(u.pembicara));
  const diCelah = kandidat.filter(
    (k) => !dewasaSemua.some((u) => k.t_mulai < u.t_selesai - 0.1 && k.t_selesai > u.t_mulai + 0.1),
  );
  if (diCelah.length > 0) {
    return {
      perekam,
      anak,
      dewasa_lain: dewasa,
      suara_anak: diCelah.map(({ t_mulai, t_selesai }) => ({ t_mulai, t_selesai })),
      sumber_suara_anak: "celah_hening",
    };
  }
  return { perekam, anak, dewasa_lain: dewasa, suara_anak: [], sumber_suara_anak: "tidak_ada" };
}
