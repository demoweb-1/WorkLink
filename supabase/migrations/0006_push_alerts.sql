-- Phone alerts for workers (Web Push). One row per device a worker has turned alerts on for.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index on push_subscriptions (user_id);
alter table push_subscriptions enable row level security;   -- no policies: apps use the two functions below; the alert sender uses the service role.

-- A device can change hands (someone signs out and another signs in), so a plain upsert under RLS would fail. These run as definer and only ever act for the signed-in user.
create function save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into push_subscriptions (user_id, endpoint, p256dh, auth) values (auth.uid(), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;
revoke all on function save_push_subscription(text, text, text) from public;
grant execute on function save_push_subscription(text, text, text) to authenticated;

create function remove_push_subscription(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint and user_id = auth.uid() $$;
revoke all on function remove_push_subscription(text) from public;
grant execute on function remove_push_subscription(text) to authenticated;
