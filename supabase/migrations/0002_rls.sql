-- Talkly: RLS dan penyimpanan (A1.2).
--   * Peran anon tidak punya kebijakan apa pun: tidak bisa membaca atau menulis tabel mana pun.
--   * Keluarga hanya lewat app/api (service role, setelah sesi dicek dan kueri difilter anak_id).
--   * Terapis yang masuk (authenticated) hanya membaca anak yang ditanganinya beserta data turunannya.

alter table klinik enable row level security;
alter table terapis enable row level security;
alter table anak enable row level security;
alter table anggota enable row level security;
alter table undangan enable row level security;
alter table aktivitas enable row level security;
alter table rencana enable row level security;
alter table rencana_item enable row level security;
alter table log_aktivitas enable row level security;
alter table rekaman enable row level security;
alter table hasil_rekaman enable row level security;
alter table laporan_keluarga enable row level security;
alter table pesan enable row level security;
alter table catatan_sesi enable row level security;
alter table draf_rencana enable row level security;
alter table riwayat_status enable row level security;
alter table log_dengar enable row level security;
alter table langganan_push enable row level security;

-- Apakah anak ini ditangani terapis yang sedang masuk?
create function ditangani_saya(p_anak uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from anak where id = p_anak and terapis_id = auth.uid());
$$;
revoke execute on function ditangani_saya(uuid) from anon, public;
grant execute on function ditangani_saya(uuid) to authenticated;

create policy terapis_diri on terapis for select to authenticated using (id = auth.uid());
create policy klinik_sendiri on klinik for select to authenticated
  using (id in (select klinik_id from terapis where id = auth.uid()));
create policy aktivitas_semua_terapis on aktivitas for select to authenticated using (true);

create policy anak_ditangani on anak for select to authenticated using (terapis_id = auth.uid());
create policy anggota_ditangani on anggota for select to authenticated using (ditangani_saya(anak_id));
create policy undangan_ditangani on undangan for select to authenticated using (ditangani_saya(anak_id));
create policy rencana_ditangani on rencana for select to authenticated using (ditangani_saya(anak_id));
create policy rencana_item_ditangani on rencana_item for select to authenticated
  using (exists (select 1 from rencana r where r.id = rencana_id and ditangani_saya(r.anak_id)));
create policy log_aktivitas_ditangani on log_aktivitas for select to authenticated
  using (exists (select 1 from anggota a where a.id = anggota_id and ditangani_saya(a.anak_id)));
create policy rekaman_ditangani on rekaman for select to authenticated using (ditangani_saya(anak_id));
create policy hasil_ditangani on hasil_rekaman for select to authenticated
  using (exists (select 1 from rekaman r where r.id = rekaman_id and ditangani_saya(r.anak_id)));
create policy laporan_ditangani on laporan_keluarga for select to authenticated using (ditangani_saya(anak_id));
create policy pesan_ditangani on pesan for select to authenticated using (ditangani_saya(anak_id));
create policy catatan_ditangani on catatan_sesi for select to authenticated using (ditangani_saya(anak_id));
create policy draf_ditangani on draf_rencana for select to authenticated using (ditangani_saya(anak_id));
create policy status_ditangani on riwayat_status for select to authenticated using (ditangani_saya(anak_id));
create policy log_dengar_diri on log_dengar for select to authenticated using (terapis_id = auth.uid());
-- langganan_push: tanpa kebijakan, hanya service role.

-- Bucket audio privat. Path: <anak_id>/<rekaman_id>.webm. Tanpa kebijakan storage untuk anon/authenticated:
-- unggah dan tautan bertanda tangan hanya dibuat server.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', false, 5242880, array['audio/webm', 'audio/ogg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
