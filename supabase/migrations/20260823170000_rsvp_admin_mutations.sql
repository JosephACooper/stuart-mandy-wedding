-- Passphrase-guarded RSVP mutations for the admin response board. Raw table
-- UPDATE/DELETE access remains closed; these narrowly scoped RPCs are the only
-- client-accessible mutation path.
create or replace function public.update_rsvp_admin(
  p_passcode text,
  p_rsvp_id uuid,
  p_guest_name text,
  p_attending boolean,
  p_party_size smallint,
  p_guest_names text,
  p_dietary_requirements text,
  p_song_request text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_recent_attempts int;
  v_row public.rsvps;
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

  update rsvps
  set guest_name = trim(p_guest_name),
      attending = p_attending,
      party_size = case when p_attending then p_party_size else 1 end,
      guest_names = case when p_attending then nullif(trim(p_guest_names), '') else null end,
      dietary_requirements = case when p_attending then nullif(trim(p_dietary_requirements), '') else null end,
      song_request = case when p_attending then nullif(trim(p_song_request), '') else null end,
      message = nullif(trim(p_message), '')
  where id = p_rsvp_id
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'row', to_jsonb(v_row));
end;
$$;

revoke all on function public.update_rsvp_admin(text, uuid, text, boolean, smallint, text, text, text, text) from public;
grant execute on function public.update_rsvp_admin(text, uuid, text, boolean, smallint, text, text, text, text) to anon;
revoke execute on function public.update_rsvp_admin(text, uuid, text, boolean, smallint, text, text, text, text) from authenticated;

create or replace function public.delete_rsvp_admin(p_passcode text, p_rsvp_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_recent_attempts int;
  v_deleted_id uuid;
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

  delete from rsvps where id = p_rsvp_id returning id into v_deleted_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'id', v_deleted_id);
end;
$$;

revoke all on function public.delete_rsvp_admin(text, uuid) from public;
grant execute on function public.delete_rsvp_admin(text, uuid) to anon;
revoke execute on function public.delete_rsvp_admin(text, uuid) from authenticated;
