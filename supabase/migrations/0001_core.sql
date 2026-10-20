-- WorkLink core schema. Run in Supabase SQL editor or `supabase db push`.
-- Roles live in user_roles (NOT in profiles) so users cannot self-promote.

create type job_status     as enum ('draft','open','accepted','closed','cancelled');
create type offer_status   as enum ('pending','accepted','declined','withdrawn');
create type booking_status as enum ('accepted','in_progress','completed','cancelled');
create type budget_type    as enum ('fixed','range','negotiable');
create type app_role       as enum ('admin');

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique,
  description text, icon_name text, is_active boolean not null default true
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_path text, preferred_language text not null default 'en',
  district text, public_bio text check (char_length(public_bio) <= 600),
  is_worker boolean not null default false,
  account_status text not null default 'active' check (account_status in ('active','suspended')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- Phone is private: separate table, owner-only.
create table profile_private (
  user_id uuid primary key references profiles(id) on delete cascade,
  phone_number text check (phone_number ~ '^\+94[0-9]{9}$')
);
create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role app_role not null, primary key (user_id, role)
);

create table worker_services (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references service_categories(id),
  service_title text not null, description text,
  indicative_price numeric(12,2) check (indicative_price >= 0),
  price_type text not null default 'contact' check (price_type in ('hourly','daily','fixed','contact')),
  service_areas text[] not null default '{}', years_experience int check (years_experience between 0 and 60),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on worker_services (category_id) where is_active;
create index on worker_services using gin (service_areas);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references service_categories(id),
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 20 and 3000),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 5),
  district text not null, approximate_location text,
  budget_type budget_type not null default 'negotiable',
  budget_min numeric(12,2), budget_max numeric(12,2),
  preferred_date date, status job_status not null default 'open',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (budget_min is null or budget_max is null or budget_min <= budget_max)
);
create index on jobs (status, category_id, district, created_at desc);
-- Exact address lives apart; only revealed to the accepted worker.
create table job_private (
  job_id uuid primary key references jobs(id) on delete cascade,
  address_details text
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  proposed_price numeric(12,2) not null check (proposed_price > 0),
  message text not null check (char_length(message) between 10 and 1000),
  proposed_start_date date, estimated_duration text,
  status offer_status not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (job_id, worker_id)               -- one offer per worker per job
);
create index on offers (job_id, status);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references jobs(id),       -- one booking per job
  offer_id uuid not null unique references offers(id),
  customer_id uuid not null references profiles(id),
  worker_id uuid not null references profiles(id),
  agreed_price numeric(12,2) not null, agreed_scope text,
  scheduled_at timestamptz, status booking_status not null default 'accepted',
  completed_at timestamptz, cancelled_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  reviewer_id uuid not null references profiles(id),
  reviewee_id uuid not null references profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (booking_id, reviewer_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, title text not null, body text,
  related_entity_type text, related_entity_id uuid,
  read_at timestamptz, created_at timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

create table saved_workers (
  customer_id uuid references profiles(id) on delete cascade,
  worker_id uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (customer_id, worker_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id),
  reported_user_id uuid references profiles(id), job_id uuid references jobs(id),
  booking_id uuid references bookings(id),
  reason text not null, description text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolution_note text, created_at timestamptz not null default now(), resolved_at timestamptz
);
create table moderation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id), action text not null,
  target_type text not null, target_id uuid, reason text,
  created_at timestamptz not null default now()
);

-- ---------- helpers ----------
create function is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') $$;

create function touch_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;
create trigger t_profiles before update on profiles for each row execute function touch_updated_at();
create trigger t_jobs     before update on jobs     for each row execute function touch_updated_at();
create trigger t_offers   before update on offers   for each row execute function touch_updated_at();

-- Block users from changing protected profile fields.
create function protect_profile() returns trigger language plpgsql as $$
begin
  if not is_admin() and new.account_status is distinct from old.account_status then
    raise exception 'account_status is admin-only';
  end if;
  return new;
end $$;
create trigger t_protect_profile before update on profiles for each row execute function protect_profile();

-- ---------- RLS ----------
alter table service_categories enable row level security;
alter table profiles enable row level security;
alter table profile_private enable row level security;
alter table user_roles enable row level security;
alter table worker_services enable row level security;
alter table jobs enable row level security;
alter table job_private enable row level security;
alter table offers enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table saved_workers enable row level security;
alter table reports enable row level security;
alter table moderation_audit_logs enable row level security;

create policy cat_read   on service_categories for select using (is_active or is_admin());
create policy cat_admin  on service_categories for all using (is_admin()) with check (is_admin());

create policy prof_read  on profiles for select using (account_status = 'active' or id = auth.uid() or is_admin());
create policy prof_ins   on profiles for insert with check (id = auth.uid());
create policy prof_upd   on profiles for update using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy priv_own   on profile_private for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy roles_self on user_roles for select using (user_id = auth.uid());  -- no write policy: service role only

create policy ws_read    on worker_services for select using (is_active or worker_id = auth.uid() or is_admin());
create policy ws_own     on worker_services for all using (worker_id = auth.uid()) with check (worker_id = auth.uid());

create policy job_read   on jobs for select using (
  customer_id = auth.uid() or is_admin()
  or (status = 'open' and exists (select 1 from profiles p where p.id = auth.uid() and p.is_worker))
  or exists (select 1 from bookings b where b.job_id = jobs.id and b.worker_id = auth.uid()));
create policy job_ins    on jobs for insert with check (customer_id = auth.uid() and status in ('draft','open'));
create policy job_upd    on jobs for update using (customer_id = auth.uid() and status in ('draft','open'))
                                   with check (customer_id = auth.uid() and status in ('draft','open','cancelled','closed'));
create policy job_del    on jobs for delete using (customer_id = auth.uid() and status = 'draft');
create policy jp_owner   on job_private for all using (exists (select 1 from jobs j where j.id = job_id and j.customer_id = auth.uid()))
                                          with check (exists (select 1 from jobs j where j.id = job_id and j.customer_id = auth.uid()));
create policy jp_worker  on job_private for select using (exists (select 1 from bookings b where b.job_id = job_private.job_id and b.worker_id = auth.uid()));

create policy off_read   on offers for select using (
  worker_id = auth.uid() or is_admin()
  or exists (select 1 from jobs j where j.id = job_id and j.customer_id = auth.uid()));
create policy off_ins    on offers for insert with check (
  worker_id = auth.uid() and status = 'pending'
  and exists (select 1 from jobs j where j.id = job_id and j.status = 'open' and j.customer_id <> auth.uid())
  and exists (select 1 from profiles p where p.id = auth.uid() and p.is_worker));
-- Workers may edit pending offers or withdraw; never self-accept.
create policy off_upd    on offers for update using (worker_id = auth.uid() and status = 'pending')
                                   with check (worker_id = auth.uid() and status in ('pending','withdrawn'));

create policy bk_read    on bookings for select using (customer_id = auth.uid() or worker_id = auth.uid() or is_admin());
-- No direct insert/update on bookings: use accept_offer() and set_booking_status().

create policy rev_read   on reviews for select using (true);
create policy rev_ins    on reviews for insert with check (
  reviewer_id = auth.uid()
  and exists (select 1 from bookings b where b.id = booking_id and b.status = 'completed'
     and ((b.customer_id = auth.uid() and b.worker_id = reviewee_id)
       or (b.worker_id = auth.uid() and b.customer_id = reviewee_id))));

create policy notif_own  on notifications for select using (user_id = auth.uid());
create policy notif_read on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sv_own     on saved_workers for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy rep_ins    on reports for insert with check (reporter_id = auth.uid());
create policy rep_read   on reports for select using (reporter_id = auth.uid() or is_admin());
create policy rep_admin  on reports for update using (is_admin()) with check (is_admin());
create policy log_admin  on moderation_audit_logs for select using (is_admin());
create policy log_ins    on moderation_audit_logs for insert with check (is_admin() and admin_id = auth.uid());

-- ---------- secure transactions ----------
-- Atomically accept one offer. SECURITY DEFINER, but checks auth.uid() ownership itself.
create function accept_offer(p_offer_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_offer offers; v_job jobs; v_booking uuid;
begin
  select * into v_offer from offers where id = p_offer_id;
  if not found then raise exception 'Offer not found'; end if;
  select * into v_job from jobs where id = v_offer.job_id for update;   -- row lock serialises concurrent accepts
  if v_job.customer_id <> auth.uid() then raise exception 'Not your job'; end if;
  if v_job.status <> 'open' then raise exception 'Job is no longer open'; end if;
  if v_offer.status <> 'pending' then raise exception 'Offer is not available'; end if;

  update offers set status = 'accepted' where id = p_offer_id;
  update offers set status = 'declined' where job_id = v_job.id and id <> p_offer_id and status = 'pending';
  update jobs   set status = 'accepted' where id = v_job.id;
  insert into bookings (job_id, offer_id, customer_id, worker_id, agreed_price, agreed_scope)
    values (v_job.id, p_offer_id, v_job.customer_id, v_offer.worker_id, v_offer.proposed_price, v_job.title)
    returning id into v_booking;
  insert into notifications (user_id, type, title, related_entity_type, related_entity_id)
    select worker_id, case when id = p_offer_id then 'offer_accepted' else 'offer_declined' end,
           case when id = p_offer_id then 'Your offer was accepted' else 'Another offer was chosen' end,
           'job', v_job.id
    from offers where job_id = v_job.id and status in ('accepted','declined');
  return v_booking;
end $$;
revoke all on function accept_offer(uuid) from public;
grant execute on function accept_offer(uuid) to authenticated;

-- Allowed booking transitions and who may trigger them.
create function set_booking_status(p_booking_id uuid, p_status booking_status) returns void
language plpgsql security definer set search_path = public as $$
declare b bookings;
begin
  select * into b from bookings where id = p_booking_id for update;
  if not found or auth.uid() not in (b.customer_id, b.worker_id) then raise exception 'Not allowed'; end if;
  if not (
       (b.status = 'accepted'    and p_status = 'in_progress' and auth.uid() = b.worker_id)
    or (b.status = 'in_progress' and p_status = 'completed'   and auth.uid() = b.customer_id)
    or (b.status in ('accepted','in_progress') and p_status = 'cancelled')
  ) then raise exception 'Invalid transition % -> %', b.status, p_status; end if;
  update bookings set status = p_status,
    completed_at = case when p_status = 'completed' then now() else completed_at end,
    cancelled_at = case when p_status = 'cancelled' then now() else cancelled_at end
  where id = p_booking_id;
  insert into notifications (user_id, type, title, related_entity_type, related_entity_id)
    values (case when auth.uid() = b.customer_id then b.worker_id else b.customer_id end,
            'booking_status', 'Booking is now ' || p_status, 'booking', b.id);
end $$;
revoke all on function set_booking_status(uuid, booking_status) from public;
grant execute on function set_booking_status(uuid, booking_status) to authenticated;

-- Public worker listing: no private fields, with real aggregate ratings.
create view public_workers with (security_invoker = true) as
select p.id, p.display_name, p.avatar_path, p.district, p.public_bio,
       (select count(*) from reviews r where r.reviewee_id = p.id) as review_count,
       (select round(avg(rating)::numeric, 1) from reviews r where r.reviewee_id = p.id) as avg_rating
from profiles p where p.is_worker and p.account_status = 'active';

insert into service_categories (name, slug, icon_name) values
 ('Electrical work','electrical','zap'),('Plumbing','plumbing','droplets'),('Cleaning','cleaning','sparkles'),
 ('Carpentry','carpentry','hammer'),('Painting','painting','paint-roller'),('Construction and repairs','construction','hard-hat'),
 ('Appliance repair','appliance-repair','wrench'),('Gardening and landscaping','gardening','sprout'),
 ('Moving assistance','moving','truck'),('General handyman','handyman','toolbox');

-- To create the first admin, run manually (SQL editor, service role):
--   insert into user_roles (user_id, role) values ('<auth user uuid>', 'admin');
