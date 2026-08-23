-- A deliberately isolated heartbeat for keeping the free Supabase project active.
-- It reads no application tables and writes no data.
create or replace function public.keep_alive()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

revoke execute on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon;

comment on function public.keep_alive() is
  'Read-only heartbeat used by the scheduled GitHub Action.';
