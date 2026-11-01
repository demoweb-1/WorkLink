-- Optional photo and voice message on a request. Files live in a private bucket; only matching workers can read them.
alter table quick_requests add column photo_path text, add column voice_path text;
grant select (photo_path, voice_path) on quick_requests to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-media', 'request-media', false, 5242880, array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg'])
on conflict (id) do nothing;

-- Uploads are only accepted into the folder of a request that exists and is still open.
create function request_accepts_media(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from quick_requests where id = p_id and status = 'open' and expires_at > now()) $$;
revoke all on function request_accepts_media(uuid) from public;
grant execute on function request_accepts_media(uuid) to anon, authenticated;

create policy rm_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'request-media' and public.request_accepts_media(((storage.foldername(name))[1])::uuid));
-- The sub-select runs under the worker's own access, so only requests that match that worker are readable.
create policy rm_workers_read on storage.objects for select to authenticated
  using (bucket_id = 'request-media' and exists (select 1 from public.quick_requests q where q.id::text = (storage.foldername(name))[1]));

create function attach_request_media(p_id uuid, p_token uuid, p_photo text, p_voice text) returns void
language sql security definer set search_path = public as $$
  update quick_requests set photo_path = coalesce(case when p_photo like p_id::text || '/%' then p_photo end, photo_path),
                            voice_path = coalesce(case when p_voice like p_id::text || '/%' then p_voice end, voice_path)
  where id = p_id and close_token = p_token $$;
revoke all on function attach_request_media(uuid, uuid, text, text) from public;
grant execute on function attach_request_media(uuid, uuid, text, text) to anon, authenticated;
