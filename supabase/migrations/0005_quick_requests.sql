-- "Call me back" requests: a customer picks a service + district and leaves a phone number. No account needed.
-- Matching workers (same service, serving that district) see the request and call the customer.
create table quick_requests (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references service_categories(id),
  district text not null check (char_length(district) between 3 and 40),
  phone text not null check (phone ~ '^\+94[0-9]{9}$'),
  note text check (char_length(note) <= 200),
  customer_id uuid references profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed')),
  close_token uuid not null default gen_random_uuid(),   -- secret held by the customer's device; never readable by others
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index on quick_requests (category_id, district, status, created_at desc);
alter table quick_requests enable row level security;

-- Nobody writes directly; and nobody can read close_token.
revoke all on quick_requests from anon, authenticated;
grant select (id, category_id, district, phone, note, status, created_at, expires_at) on quick_requests to authenticated;
create policy qr_matching_workers on quick_requests for select to authenticated using (
  status = 'open' and expires_at > now() and exists (
    select 1 from worker_services ws
    where ws.worker_id = auth.uid() and ws.is_active and ws.category_id = quick_requests.category_id
      and quick_requests.district = any (ws.service_areas)));

create function create_quick_request(p_category uuid, p_district text, p_phone text, p_note text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_token uuid;
begin
  if p_phone is null or p_phone !~ '^\+94[0-9]{9}$' then raise exception 'Invalid phone number'; end if;
  if not exists (select 1 from service_categories where id = p_category and is_active) then raise exception 'Invalid service'; end if;
  if p_district is null or char_length(p_district) not between 3 and 40 then raise exception 'Invalid district'; end if;
  if (select count(*) from quick_requests where phone = p_phone and created_at > now() - interval '1 day') >= 5 then raise exception 'Too many requests'; end if;
  insert into quick_requests (category_id, district, phone, note, customer_id)
  values (p_category, p_district, p_phone, nullif(left(trim(coalesce(p_note, '')), 200), ''), (select id from profiles where id = auth.uid()))
  returning id, close_token into v_id, v_token;
  return jsonb_build_object('id', v_id, 'token', v_token);
end $$;
revoke all on function create_quick_request(uuid, text, text, text) from public;
grant execute on function create_quick_request(uuid, text, text, text) to anon, authenticated;

create function close_quick_request(p_id uuid, p_token uuid) returns void
language sql security definer set search_path = public as $$
  update quick_requests set status = 'closed' where id = p_id and close_token = p_token $$;
revoke all on function close_quick_request(uuid, uuid) from public;
grant execute on function close_quick_request(uuid, uuid) to anon, authenticated;
