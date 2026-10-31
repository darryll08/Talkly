-- Talkly: skema inti (A1.1). Jalankan di TALKLY-DEV dan TALKLY, urut nomor file.
-- Aturan yang dijaga di sini:
--   * Setiap kolom waktu `dibuat` wajib terisi (default now()), termasuk saat insert massal oleh seed.
--   * Menghapus anak menghapus seluruh data turunannya (cascade), sehingga seed cukup menghapus anak data_contoh.
--   * Menghapus anggota menghapus rekaman, laporan, pesan, dan langganan push miliknya; rujukan lain di-set null.

create extension if not exists pgcrypto;

-- Klinik dan terapis --------------------------------------------------------

create table klinik (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  data_contoh boolean not null default false,
  dibuat timestamptz not null default now()
);

create table terapis (
  id uuid primary key references auth.users (id) on delete cascade,
  klinik_id uuid not null references klinik (id) on delete cascade,
  nama text not null,
  dibuat timestamptz not null default now()
);

-- Anak dan keluarga ---------------------------------------------------------

create table anak (
  id uuid primary key default gen_random_uuid(),
  klinik_id uuid not null references klinik (id) on delete cascade,
  terapis_id uuid references terapis (id) on delete set null,
  nama text not null,
  tanggal_lahir date not null,
  -- null = belum diisi terapis; undangan ditolak sampai terisi
  pendengaran text check (pendengaran in ('normal', 'belum_diperiksa', 'gangguan')),
  tahap smallint not null default 1 check (tahap between 1 and 4),
  strategi_fokus text not null default '',
  kata_target text[] not null default '{}' check (cardinality(kata_target) <= 5),
  ukuran_nonaktif text[] not null default '{}',
  minat text not null default '',
  rutinitas text not null default '',
  hari_sesi smallint check (hari_sesi between 1 and 7), -- 1 = Senin
  jam_sesi time,
  status text not null default 'lanjut' check (status in ('lanjut', 'terapis_meninjau', 'bahas_minggu_ini')),
  status_pemicu text,
  status_sejak timestamptz not null default now(),
  data_contoh boolean not null default false,
  dibuat timestamptz not null default now()
);
create index anak_terapis on anak (terapis_id);

create table anggota (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references anak (id) on delete cascade,
  nama text not null,
  peran text not null check (peran in ('ibu', 'ayah', 'pengasuh', 'nenek', 'kakek', 'lainnya')),
  pengelola_keluarga boolean not null default false,
  -- bagian depan kode masuk untuk mencari baris; sisa kode dicocokkan dengan bcrypt
  kode_masuk_id text unique,
  kode_masuk_hash text,
  gagal_masuk smallint not null default 0,
  terkunci_sampai timestamptz,
  izin_nilai boolean not null default false,
  izin_dengar boolean not null default false,
  izin_klip boolean not null default false,
  perangkat_terakhir text,
  aktif boolean not null default true,
  dibuat timestamptz not null default now()
);
create index anggota_anak on anggota (anak_id) where aktif;

create table undangan (
  id uuid primary key default gen_random_uuid(),
  kode_hash text not null unique, -- SHA-256 kode undangan
  anak_id uuid not null references anak (id) on delete cascade,
  peran text not null check (peran in ('ibu', 'ayah', 'pengasuh', 'nenek', 'kakek', 'lainnya')),
  pengelola_keluarga boolean not null default false,
  dibuat_terapis uuid references terapis (id) on delete set null,
  dibuat_anggota uuid references anggota (id) on delete set null,
  kedaluwarsa timestamptz not null default now() + interval '7 days',
  dipakai_oleh uuid references anggota (id) on delete set null,
  dipakai_pada timestamptz,
  dibuat timestamptz not null default now()
);
create index undangan_anak on undangan (anak_id);

-- Bank aktivitas dan rencana ------------------------------------------------

create table aktivitas (
  id text primary key, -- misal 'MANDI-01'
  judul text not null,
  rutinitas text not null,
  langkah text[] not null check (cardinality(langkah) = 3),
  bila_mencoba text not null,
  bila_belum text not null,
  tahap smallint not null check (tahap between 1 and 4)
);

create table rencana (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references anak (id) on delete cascade,
  minggu_mulai date not null,
  sumber text not null check (sumber in ('terapis', 'draf_ai')),
  pesan_keluarga text not null default '',
  disetujui boolean not null default false,
  disetujui_pada timestamptz,
  dibuat timestamptz not null default now()
);
create index rencana_anak on rencana (anak_id, minggu_mulai desc, disetujui_pada desc);

create table rencana_item (
  id uuid primary key default gen_random_uuid(),
  rencana_id uuid not null references rencana (id) on delete cascade,
  anggota_id uuid references anggota (id) on delete cascade, -- null = untuk semua anggota
  aktivitas_id text not null references aktivitas (id),
  urutan smallint not null default 0
);
create index rencana_item_rencana on rencana_item (rencana_id);

create table log_aktivitas (
  id uuid primary key default gen_random_uuid(),
  anggota_id uuid not null references anggota (id) on delete cascade,
  rencana_item_id uuid not null references rencana_item (id) on delete cascade,
  tanggal date not null,
  selesai boolean not null default true,
  dibuat timestamptz not null default now(),
  unique (anggota_id, rencana_item_id, tanggal)
);

-- Rekaman -------------------------------------------------------------------

create table rekaman (
  id uuid primary key default gen_random_uuid(),
  id_lokal text not null unique, -- dari ponsel; mencegah unggah ganda
  anggota_id uuid not null references anggota (id) on delete cascade,
  anak_id uuid not null references anak (id) on delete cascade,
  rencana_item_id uuid references rencana_item (id) on delete set null,
  path_audio text, -- null setelah audio dihapus
  durasi_s real,
  meta jsonb not null default '{}',
  jejak_hening jsonb,
  status text not null default 'antre' check (status in ('antre', 'dinilai', 'ditolak')),
  alasan_tolak text,
  proses_mulai timestamptz,
  audio_kedaluwarsa timestamptz,
  kurang_tepat boolean not null default false,
  rekaman_contoh boolean not null default false,
  dibuat timestamptz not null default now()
);
create index rekaman_anak on rekaman (anak_id, dibuat desc);
create index rekaman_audio_kedaluwarsa on rekaman (audio_kedaluwarsa) where path_audio is not null;

create table hasil_rekaman (
  rekaman_id uuid primary key references rekaman (id) on delete cascade,
  hasil jsonb not null, -- bentuk lib/kontrak/hasil.ts
  dibuat timestamptz not null default now()
);

-- Laporan dan pesan ---------------------------------------------------------

create table laporan_keluarga (
  id uuid primary key default gen_random_uuid(),
  anggota_id uuid not null references anggota (id) on delete cascade,
  anak_id uuid not null references anak (id) on delete cascade,
  jenis text not null check (jenis in ('catatan_malam', 'ceritakan_sendiri')),
  tanggal date not null,
  kata_baru text[] not null default '{}',
  kondisi text,
  regresi boolean not null default false,
  lebih_sedikit_bersuara boolean not null default false,
  isi jsonb not null, -- bentuk lib/kontrak/laporan.ts
  dibuat timestamptz not null default now()
);
create index laporan_anak on laporan_keluarga (anak_id, tanggal desc);

create table pesan (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references anak (id) on delete cascade,
  pengirim_anggota uuid references anggota (id) on delete cascade,
  pengirim_terapis uuid references terapis (id) on delete set null,
  isi text not null,
  konteks text,
  dibaca boolean not null default false,
  dibuat timestamptz not null default now(),
  check (pengirim_anggota is not null or pengirim_terapis is not null)
);
create index pesan_anak on pesan (anak_id, dibuat);

-- Terapis setelah sesi ------------------------------------------------------

create table catatan_sesi (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references anak (id) on delete cascade,
  terapis_id uuid references terapis (id) on delete set null,
  tanggal date not null default current_date,
  isi text not null,
  kata_baru_dikonfirmasi text[] not null default '{}',
  dibuat timestamptz not null default now()
);
create index catatan_sesi_anak on catatan_sesi (anak_id, dibuat desc);

create table draf_rencana (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references anak (id) on delete cascade,
  catatan_sesi_id uuid references catatan_sesi (id) on delete set null,
  isi jsonb not null,
  dasar jsonb not null default '[]',
  sumber text not null default 'ai' check (sumber in ('ai', 'cadangan')),
  status text not null default 'aktif' check (status in ('aktif', 'disetujui', 'diganti')),
  rencana_id uuid references rencana (id) on delete set null,
  dibuat timestamptz not null default now()
);
-- Satu anak hanya punya satu draf aktif (K5)
create unique index draf_satu_aktif on draf_rencana (anak_id) where status = 'aktif';

create table riwayat_status (
  id uuid primary key default gen_random_uuid(),
  anak_id uuid not null references anak (id) on delete cascade,
  status text not null check (status in ('lanjut', 'terapis_meninjau', 'bahas_minggu_ini')),
  pemicu text,
  waktu timestamptz not null default now()
);
create index riwayat_status_anak on riwayat_status (anak_id, waktu desc);

create table log_dengar (
  id uuid primary key default gen_random_uuid(),
  rekaman_id uuid not null references rekaman (id) on delete cascade,
  terapis_id uuid references terapis (id) on delete set null,
  waktu timestamptz not null default now()
);

create table langganan_push (
  endpoint text primary key,
  anggota_id uuid not null references anggota (id) on delete cascade,
  langganan jsonb not null,
  dibuat timestamptz not null default now()
);
create index langganan_push_anggota on langganan_push (anggota_id);
