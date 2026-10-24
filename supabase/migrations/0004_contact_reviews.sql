-- Reviews from customers who contacted a worker through WorkLink (call / WhatsApp), in addition to completed bookings.
-- Honest limit: a phone call happens outside the app, so this proves "contacted", not "hired". The UI labels it that way.

alter table reviews alter column booking_id drop not null;
alter table reviews add column source text not null default 'booking' check (source in ('booking','contact'));
alter table reviews add constraint reviews_source_chk check (
  (source = 'booking' and booking_id is not null) or (source = 'contact' and booking_id is null));
-- one contact-review per customer per worker
create unique index reviews_one_contact_per_pair on reviews (reviewer_id, reviewee_id) where source = 'contact';

create table contact_clicks (
  customer_id uuid not null references profiles(id) on delete cascade,
  worker_id   uuid not null references profiles(id) on delete cascade,
  channel text not null default 'call' check (channel in ('call','whatsapp')),
  created_at timestamptz not null default now(),
  primary key (customer_id, worker_id),
  check (customer_id <> worker_id)
);
alter table contact_clicks enable row level security;
create policy cc_own on contact_clicks for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

create policy rev_ins_contact on reviews for insert with check (
  source = 'contact' and booking_id is null
  and reviewer_id = auth.uid() and reviewer_id <> reviewee_id
  and exists (select 1 from contact_clicks c where c.customer_id = auth.uid() and c.worker_id = reviewee_id)
  and exists (select 1 from profiles p where p.id = reviewee_id and p.is_worker));
