-- Guest RSVP submissions
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  guest_name text not null check (char_length(guest_name) between 1 and 200),
  attending boolean not null,
  party_size smallint not null default 1 check (party_size between 1 and 10),
  guest_names text check (char_length(guest_names) <= 500),
  dietary_requirements text check (char_length(dietary_requirements) <= 1000),
  song_request text check (char_length(song_request) <= 300),
  message text check (char_length(message) <= 2000),
  website text check (website is null or website = '') -- honeypot, must stay blank
);

create index rsvps_created_at_idx on public.rsvps (created_at desc);

alter table public.rsvps enable row level security;

create policy "anyone can submit an rsvp"
  on public.rsvps for insert
  to anon
  with check (true);
-- Deliberately no SELECT/UPDATE/DELETE policy for anon/authenticated:
-- the raw table stays unreadable via the public anon key even though
-- that key is necessarily visible in the client JS bundle.

-- Single-row settings table holding the hashed shared passphrase.
-- No policies at all -> default-deny for anon/authenticated; only the
-- SECURITY DEFINER function below (owned by the table owner, which
-- bypasses RLS) can read it.
create table public.rsvp_settings (
  id boolean primary key default true check (id),
  passcode_hash text not null
);
alter table public.rsvp_settings enable row level security;

-- Minimal brute-force friction for the passcode-guarded read RPC.
create table public.rsvp_access_attempts (
  id bigint generated always as identity primary key,
  attempted_at timestamptz not null default now()
);
alter table public.rsvp_access_attempts enable row level security;

-- Guarded read: table SELECT stays closed to anon; the only door in is
-- this function, which checks the hashed passphrase and rate-limits
-- failed attempts before returning any rows.
create or replace function public.get_rsvp_results(p_passcode text)
returns setof public.rsvps
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_recent_attempts int;
begin
  select count(*) into v_recent_attempts
    from rsvp_access_attempts
    where attempted_at > now() - interval '15 minutes';

  if v_recent_attempts >= 20 then
    raise exception 'too many attempts, please wait a few minutes and try again';
  end if;

  select passcode_hash into v_hash from rsvp_settings where id = true;

  if v_hash is null or crypt(p_passcode, v_hash) <> v_hash then
    insert into rsvp_access_attempts default values;
    raise exception 'incorrect passcode';
  end if;

  return query select * from rsvps order by created_at desc;
end;
$$;

revoke all on function public.get_rsvp_results(text) from public;
grant execute on function public.get_rsvp_results(text) to anon;;
