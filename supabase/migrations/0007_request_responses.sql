-- Phase 1 of the simplified flow: workers respond to requests; contact details are revealed only after a worker says yes.
alter table quick_requests add column location text check (char_length(location) <= 120);
revoke select (phone) on quick_requests from authenticated;     -- workers no longer see the customer's number up front
grant select (location) on quick_requests to authenticated;

create table request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references quick_requests(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  response text not null check (response in ('accept','decline')),
  price numeric(12,2) check (price is null or price > 0),
  created_at timestamptz not null default now(),
  unique (request_id, worker_id));
alter table request_responses enable row level security;
create policy rr_own on request_responses for select using (worker_id = auth.uid());
revoke insert, update, delete on request_responses from anon, authenticated;

drop function if exists create_quick_request(uuid, text, text, text);
create function create_quick_request(p_category uuid, p_district text, p_phone text, p_note text, p_location text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_token uuid;
begin
  if p_phone is null or p_phone !~ '^\+94[0-9]{9}$' then raise exception 'Invalid phone number'; end if;
  if not exists (select 1 from service_categories where id = p_category and is_active) then raise exception 'Invalid service'; end if;
  if p_district is null or char_length(p_district) not between 3 and 40 then raise exception 'Invalid district'; end if;
  if (select count(*) from quick_requests where phone = p_phone and created_at > now() - interval '1 day') >= 5 then raise exception 'Too many requests'; end if;
  insert into quick_requests (category_id, district, phone, note, location, customer_id)
  values (p_category, p_district, p_phone, nullif(left(trim(coalesce(p_note, '')), 200), ''), nullif(left(trim(coalesce(p_location, '')), 120), ''), (select id from profiles where id = auth.uid()))
  returning id, close_token into v_id, v_token;
  return jsonb_build_object('id', v_id, 'token', v_token);
end $$;
revoke all on function create_quick_request(uuid, text, text, text, text) from public;
grant execute on function create_quick_request(uuid, text, text, text, text) to anon, authenticated;

create function respond_to_request(p_request_id uuid, p_response text, p_price numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if p_response not in ('accept','decline') then raise exception 'Bad response'; end if;
  if not exists (select 1 from quick_requests q join worker_services ws on ws.worker_id = auth.uid() and ws.is_active and ws.category_id = q.category_id and q.district = any (ws.service_areas)
                 where q.id = p_request_id and q.status = 'open' and q.expires_at > now()) then raise exception 'Request not available'; end if;
  insert into request_responses (request_id, worker_id, response, price) values (p_request_id, auth.uid(), p_response, case when p_response = 'accept' then p_price end)
  on conflict (request_id, worker_id) do update set response = excluded.response, price = excluded.price;
end $$;
revoke all on function respond_to_request(uuid, text, numeric) from public;
grant execute on function respond_to_request(uuid, text, numeric) to authenticated;

-- Worker: customer's number, only after this worker accepted.
create function request_contact(p_request_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select q.phone from quick_requests q where q.id = p_request_id
    and exists (select 1 from request_responses r where r.request_id = q.id and r.worker_id = auth.uid() and r.response = 'accept') $$;
revoke all on function request_contact(uuid) from public;
grant execute on function request_contact(uuid) to authenticated;

-- Customer (no account): status and the workers who said yes, using the secret token kept on their device.
create function get_request_status(p_id uuid, p_token uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare q quick_requests; res jsonb;
begin
  select * into q from quick_requests where id = p_id and close_token = p_token;
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('worker_id', r.worker_id, 'name', p.display_name, 'price', r.price,
           'phone', coalesce(wc.phone, pp.phone_number), 'whatsapp', coalesce(wc.whatsapp, true)) order by r.created_at), '[]'::jsonb) into res
  from request_responses r join profiles p on p.id = r.worker_id
  left join worker_contacts wc on wc.worker_id = r.worker_id left join profile_private pp on pp.user_id = r.worker_id
  where r.request_id = q.id and r.response = 'accept';
  return jsonb_build_object('status', q.status, 'district', q.district, 'note', q.note, 'location', q.location, 'created_at', q.created_at, 'expires_at', q.expires_at,
    'category', (select name from service_categories where id = q.category_id), 'slug', (select slug from service_categories where id = q.category_id), 'responses', res);
end $$;
revoke all on function get_request_status(uuid, uuid) from public;
grant execute on function get_request_status(uuid, uuid) to anon, authenticated;
