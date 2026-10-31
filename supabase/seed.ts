// Data contoh demo (A2.2). Idempoten: menghapus semua data_contoh lalu mengisi ulang.
//   npm run seed                        → TALKLY-DEV (.env.local), termasuk Keluarga Uji B dan terapis kedua
//   npm run seed:produksi               → TALKLY (.env.vercel-produksi), tanpa data uji
// Butuh DEMO_TERAPIS_KATA_SANDI di file env untuk akun Kak Nadia.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import aktivitas from "../data/aktivitas.json";
import { BankAktivitas } from "../lib/kontrak/konten";
import { EMAIL_TERAPIS_CONTOH, ID_CONTOH } from "../lib/server/data-contoh";
import { pastikanAdminContoh } from "../lib/admin/akun";
import { anakLain, hariSesiBesok, riwayatRaka } from "./seed-riwayat";

const DEV = process.argv.includes("--dev");

function wajib(nama: string): string {
  const v = process.env[nama];
  if (!v) throw new Error(`${nama} belum diisi`);
  return v;
}

const db: SupabaseClient = createClient(wajib("NEXT_PUBLIC_SUPABASE_URL"), wajib("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function cek<T>(langkah: string, p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${langkah}: ${error.message}`);
  return data;
}

/** Akun Auth terapis contoh: dibuat bila belum ada, kata sandi disamakan dengan env. */
async function akunTerapis(email: string, kataSandi: string): Promise<string> {
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`daftar akun: ${error.message}`);
  const ada = data.users.find((u) => u.email === email);
  if (ada) {
    const { error: e } = await db.auth.admin.updateUserById(ada.id, { password: kataSandi });
    if (e) throw new Error(`kata sandi terapis: ${e.message}`);
    return ada.id;
  }
  const baru = await db.auth.admin.createUser({ email, password: kataSandi, email_confirm: true });
  if (baru.error || !baru.data.user) throw new Error(`akun terapis: ${baru.error?.message}`);
  return baru.data.user.id;
}

/** Senin minggu ini (WIB) sebagai yyyy-mm-dd. */
function seninIni(): string {
  const wib = new Date(Date.now() + 7 * 3600_000);
  const hari = (wib.getUTCDay() + 6) % 7;
  wib.setUTCDate(wib.getUTCDate() - hari);
  return wib.toISOString().slice(0, 10);
}

function tanggalLahir(usiaBulan: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - usiaBulan);
  return d.toISOString().slice(0, 10);
}

async function utama() {
  const proyek = new URL(wajib("NEXT_PUBLIC_SUPABASE_URL")).hostname.split(".")[0];
  console.log(`Seed ke ${proyek}${DEV ? " (dev, dengan data uji)" : ""}`);

  // 1. Bersihkan. Menghapus anak dan klinik contoh menghapus seluruh turunannya (cascade).
  await cek("hapus anak contoh", db.from("anak").delete().eq("data_contoh", true));
  await cek("hapus klinik contoh", db.from("klinik").delete().eq("data_contoh", true));

  // 2. Bank aktivitas (upsert, karena bukan data_contoh).
  await cek("aktivitas", db.from("aktivitas").upsert(BankAktivitas.parse(aktivitas)));

  // 3. Klinik dan terapis.
  await cek("klinik", db.from("klinik").insert({ id: ID_CONTOH.klinik, nama: "Klinik Tumbuh Kembang Contoh", data_contoh: true }));
  const nadiaId = await akunTerapis(EMAIL_TERAPIS_CONTOH.nadia, wajib("DEMO_TERAPIS_KATA_SANDI"));
  await cek("terapis", db.from("terapis").insert({ id: nadiaId, klinik_id: ID_CONTOH.klinik, nama: "Kak Nadia" }));

  // 4. Raka dan keluarganya.
  await cek(
    "anak Raka",
    db.from("anak").insert({
      id: ID_CONTOH.raka,
      klinik_id: ID_CONTOH.klinik,
      terapis_id: nadiaId,
      nama: "Raka",
      tanggal_lahir: tanggalLahir(28),
      pendengaran: "normal",
      tahap: 1,
      strategi_fokus: "Menunggu: diam sampai hitungan lima setelah mengajak",
      kata_target: ["bebek", "mamam", "lagi", "mau", "buka"],
      minat: "Bebek karet, mobil-mobilan, lagu anak",
      rutinitas: "Mandi sore, makan bersama, main di teras dengan Mbak Sri",
      hari_sesi: hariSesiBesok(),
      jam_sesi: "10:00",
      status: "lanjut",
      data_contoh: true,
    }),
  );
  await cek(
    "anggota Raka",
    db.from("anggota").insert([
      {
        id: ID_CONTOH.ibuSari,
        anak_id: ID_CONTOH.raka,
        nama: "Ibu Sari",
        peran: "ibu",
        pengelola_keluarga: true,
        izin_nilai: true,
        izin_dengar: true,
        izin_klip: true,
      },
      {
        id: ID_CONTOH.mbakSri,
        anak_id: ID_CONTOH.raka,
        nama: "Mbak Sri",
        peran: "pengasuh",
        pengelola_keluarga: false,
        izin_nilai: true,
        izin_dengar: false,
        izin_klip: false,
      },
    ]),
  );

  // 5. Rencana minggu ini yang sudah disetujui Kak Nadia.
  const rencana = await cek(
    "rencana",
    db
      .from("rencana")
      .insert({
        anak_id: ID_CONTOH.raka,
        minggu_mulai: seninIni(),
        sumber: "terapis",
        pesan_keluarga: "Minggu ini kita latihan menunggu. Setelah mengajak Raka, diam dulu sampai hitungan lima, ya.",
        disetujui: true,
        disetujui_pada: new Date().toISOString(),
      })
      .select("id")
      .single(),
  );
  if (!rencana) throw new Error("rencana tidak terbuat");
  const item = await cek(
    "item rencana",
    db.from("rencana_item").insert([
      { rencana_id: rencana.id, anggota_id: null, aktivitas_id: "MANDI-01", urutan: 1 },
      { rencana_id: rencana.id, anggota_id: ID_CONTOH.ibuSari, aktivitas_id: "MAKAN-01", urutan: 2 },
      { rencana_id: rencana.id, anggota_id: ID_CONTOH.mbakSri, aktivitas_id: "MAIN-04", urutan: 3 },
    ]).select("id, urutan").order("urutan"),
  );
  await cek("riwayat status", db.from("riwayat_status").insert({ anak_id: ID_CONTOH.raka, status: "lanjut", pemicu: "Program baru", waktu: new Date(Date.now() - 21 * 86_400_000).toISOString() }));

  // 5b. Riwayat tiga minggu Raka dan 8 anak lain (total 9 anak contoh di D3).
  await riwayatRaka(db, nadiaId, (item ?? []).map((i) => i.id));
  await anakLain(db, nadiaId);

  // 5c. Akun admin Talkly (A1), sandi sama dengan akun terapis contoh.
  await pastikanAdminContoh(wajib("DEMO_TERAPIS_KATA_SANDI"));

  // 6. Data uji akses (hanya dev): terapis kedua dan Keluarga Uji B dengan anak Nara.
  if (DEV) {
    const ujiId = await akunTerapis(EMAIL_TERAPIS_CONTOH.uji, wajib("DEMO_TERAPIS_KATA_SANDI"));
    await cek("terapis uji", db.from("terapis").insert({ id: ujiId, klinik_id: ID_CONTOH.klinik, nama: "Kak Uji" }));
    await cek(
      "anak Nara",
      db.from("anak").insert({
        id: ID_CONTOH.nara,
        klinik_id: ID_CONTOH.klinik,
        terapis_id: ujiId,
        nama: "Nara",
        tanggal_lahir: tanggalLahir(30),
        pendengaran: "normal",
        tahap: 1,
        kata_target: ["bola", "susu", "lagi", "mau", "buka"],
        hari_sesi: 4,
        jam_sesi: "09:00",
        data_contoh: true,
      }),
    );
    await cek(
      "anggota Nara",
      db.from("anggota").insert({
        id: ID_CONTOH.ibuNara,
        anak_id: ID_CONTOH.nara,
        nama: "Ibu Uji B",
        peran: "ibu",
        pengelola_keluarga: true,
        izin_nilai: true,
      }),
    );
  }

  const jumlah = await Promise.all(
    ["anak", "anggota", "terapis", "aktivitas", "rencana", "rekaman", "laporan_keluarga"].map(async (t) => {
      const { count } = await db.from(t).select("*", { count: "exact", head: true });
      return `${t} ${count}`;
    }),
  );
  console.log(`Selesai: ${jumlah.join(", ")}`);
}

utama().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
