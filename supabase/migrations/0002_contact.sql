-- Lets the two people in a booking (and nobody else) read each other's phone number.
create or replace function get_booking_contact(p_booking_id uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare b bookings; other uuid; ph text;
begin
  select * into b from bookings where id = p_booking_id;
  if not found or auth.uid() not in (b.customer_id, b.worker_id) then raise exception 'Not allowed'; end if;
  if b.status = 'cancelled' then return null; end if;
  other := case when auth.uid() = b.customer_id then b.worker_id else b.customer_id end;
  select phone_number into ph from profile_private where user_id = other;
  return ph;
end $$;
revoke all on function get_booking_contact(uuid) from public;
grant execute on function get_booking_contact(uuid) to authenticated;
