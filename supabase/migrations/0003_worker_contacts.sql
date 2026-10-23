-- Workers who WANT to be called by customers publish a number here. Opt-in only; row exists = number is public.
create table worker_contacts (
  worker_id uuid primary key references profiles(id) on delete cascade,
  phone text not null check (phone ~ '^\+94[0-9]{9}$'),
  whatsapp boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table worker_contacts enable row level security;
create policy wc_read on worker_contacts for select using (
  exists (select 1 from profiles p where p.id = worker_id and p.is_worker and p.account_status = 'active'));
create policy wc_own on worker_contacts for all using (worker_id = auth.uid()) with check (worker_id = auth.uid());
