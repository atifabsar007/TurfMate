-- TurfMate Step 7.1: security hardening for the Supabase cloud backend.
-- Apply after 202611140001_turfmate_cloud_backend.sql.
begin;

-- SECURITY DEFINER functions are executable by PUBLIC by default in PostgreSQL.
-- Restrict application RPCs to authenticated users; tm_public_profiles remains public
-- because it intentionally returns only fields from profiles marked public.
revoke all on function public.tm_update_match_lineups(text,jsonb) from public, anon;
revoke all on function public.tm_join_match(text,text) from public, anon;
revoke all on function public.tm_leave_match(text) from public, anon;
revoke all on function public.tm_start_match(text) from public, anon;
revoke all on function public.tm_record_goal(text,text,uuid,uuid,int) from public, anon;
revoke all on function public.tm_finish_match(text) from public, anon;
revoke all on function public.tm_vote_motm(text,uuid) from public, anon;
revoke all on function public.tm_invite_player(text,uuid) from public, anon;
revoke all on function public.tm_respond_team_invite(uuid,boolean) from public, anon;
revoke all on function public.tm_mark_notification_read(uuid) from public, anon;

grant execute on function public.tm_update_match_lineups(text,jsonb) to authenticated;
grant execute on function public.tm_join_match(text,text) to authenticated;
grant execute on function public.tm_leave_match(text) to authenticated;
grant execute on function public.tm_start_match(text) to authenticated;
grant execute on function public.tm_record_goal(text,text,uuid,uuid,int) to authenticated;
grant execute on function public.tm_finish_match(text) to authenticated;
grant execute on function public.tm_vote_motm(text,uuid) to authenticated;
grant execute on function public.tm_invite_player(text,uuid) to authenticated;
grant execute on function public.tm_respond_team_invite(uuid,boolean) to authenticated;
grant execute on function public.tm_mark_notification_read(uuid) to authenticated;

-- Defence in depth: explicitly reject a missing auth session before touching match data.
create or replace function public.tm_leave_match(p_record_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb; v_side text; v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'You must be signed in to leave a match.';
  end if;

  select data into v_data
  from public.turfmate_records
  where collection='turfmate:matches' and record_id=p_record_id
  for update;

  if v_data is null or v_data->>'status'<>'scheduled' then
    raise exception 'You cannot leave this match now.';
  end if;
  if v_data->>'creatorId'=v_user_id::text then
    raise exception 'The match organiser cannot leave their own fixture.';
  end if;
  if not exists (
    select 1
    from jsonb_array_elements(coalesce(v_data->'homePlayers','[]'::jsonb)||coalesce(v_data->'awayPlayers','[]'::jsonb)) p
    where p->>'accountId'=v_user_id::text
  ) then
    raise exception 'You are not a player in this match.';
  end if;

  foreach v_side in array array['home','away'] loop
    v_data:=jsonb_set(
      v_data,
      array[v_side||'Players'],
      coalesce((
        select jsonb_agg(p)
        from jsonb_array_elements(coalesce(v_data->(v_side||'Players'),'[]'::jsonb)) p
        where p->>'accountId' is distinct from v_user_id::text
      ),'[]'::jsonb),
      true
    );
  end loop;

  update public.turfmate_records
  set data=v_data
  where collection='turfmate:matches' and record_id=p_record_id;
  return v_data;
end; $$;

-- Notifications are now marked read only through narrowly scoped RPCs.
drop policy if exists "notifications update own" on public.notifications;
revoke update on public.notifications from authenticated;

create or replace function public.tm_mark_all_notifications_read()
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update notifications.';
  end if;
  update public.notifications
  set read_at=now()
  where recipient_id=auth.uid() and read_at is null;
end; $$;

revoke all on function public.tm_mark_all_notifications_read() from public, anon;
grant execute on function public.tm_mark_all_notifications_read() to authenticated;

-- Invitation responses already use tm_respond_team_invite; remove broad direct UPDATE access.
drop policy if exists "invitation recipients respond" on public.team_invitations;
revoke update on public.team_invitations from authenticated;

commit;
