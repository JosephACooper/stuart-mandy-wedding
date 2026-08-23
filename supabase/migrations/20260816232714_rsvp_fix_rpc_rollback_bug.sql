-- The previous version raised an exception on a wrong passcode, which
-- rolled back the whole function call including the rsvp_access_attempts
-- insert logged just before it -- so failed attempts were never actually
-- recorded and the rate limit could never trip. Switch to a non-erroring
-- jsonb response so the attempt log commits normally on every call.
drop function if exists public.get_rsvp_results(text);

create or replace function public.get_rsvp_results(p_passcode text)
returns jsonb
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
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  select passcode_hash into v_hash from rsvp_settings where id = true;

  if v_hash is null or crypt(p_passcode, v_hash) <> v_hash then
    insert into rsvp_access_attempts default values;
    return jsonb_build_object('ok', false, 'reason', 'incorrect_passcode');
  end if;

  return jsonb_build_object(
    'ok', true,
    'rows', coalesce((select jsonb_agg(r order by r.created_at desc) from rsvps r), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_rsvp_results(text) from public;
grant execute on function public.get_rsvp_results(text) to anon;
revoke execute on function public.get_rsvp_results(text) from authenticated;;
