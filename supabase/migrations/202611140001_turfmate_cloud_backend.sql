-- TurfMate cloud backend: run this migration in Supabase SQL Editor.
-- Uses Supabase Auth, Postgres Row Level Security, Realtime and Storage.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text not null default 'TurfMate Player',
  phone text,
  position text not null default 'Midfielder',
  preferred_foot text not null default 'Right',
  area text not null default 'Dhaka',
  skill_level text not null default 'Casual',
  bio text not null default '',
  avatar_url text,
  public_profile boolean not null default false,
  available_for_matches boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.turfmate_records (
  collection text not null check (collection in ('turfmate:teams','turfmate:matches','turfmate:booking-requests')),
  record_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(collection,record_id)
);
create index if not exists turfmate_records_owner_idx on public.turfmate_records(owner_id);
create index if not exists turfmate_records_collection_idx on public.turfmate_records(collection);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id text not null,
  team_name text not null,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  inviter_name text not null,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique(team_id,invitee_id)
);
create index if not exists team_invitations_invitee_idx on public.team_invitations(invitee_id,status);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id,created_at desc);

create or replace function public.tm_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.tm_touch_updated_at();
drop trigger if exists records_touch_updated_at on public.turfmate_records;
create trigger records_touch_updated_at before update on public.turfmate_records for each row execute function public.tm_touch_updated_at();

create or replace function public.tm_handle_new_user()
returns trigger language plpgsql security definer set search_path=public,auth,extensions as $$
declare v_username text;
begin
  v_username:=lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username',split_part(new.email,'@',1)),'[^a-zA-Z0-9_]','','g'));
  if length(v_username)<3 then v_username:='player_'||substr(new.id::text,1,8); end if;
  if exists(select 1 from public.profiles p where p.username=v_username) then v_username:=left(v_username,11)||'_'||substr(new.id::text,1,8); end if;
  insert into public.profiles(id,username,full_name,phone)
  values(new.id,v_username,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'TurfMate Player'),nullif(new.raw_user_meta_data->>'phone',''))
  on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created_turfmate on auth.users;
create trigger on_auth_user_created_turfmate after insert on auth.users for each row execute function public.tm_handle_new_user();

create or replace function public.tm_public_profiles()
returns table(id uuid,username text,full_name text,position text,preferred_foot text,area text,skill_level text,bio text,avatar_url text,public_profile boolean,available_for_matches boolean,created_at timestamptz)
language sql stable security definer set search_path=public as $$
  select p.id,p.username,p.full_name,p.position,p.preferred_foot,p.area,p.skill_level,p.bio,p.avatar_url,p.public_profile,p.available_for_matches,p.created_at
  from public.profiles p where p.public_profile=true and p.available_for_matches=true;
$$;

alter table public.profiles enable row level security;
alter table public.turfmate_records enable row level security;
alter table public.team_invitations enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated using(id=auth.uid());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check(id=auth.uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

drop policy if exists "public and owned records readable" on public.turfmate_records;
create policy "public and owned records readable" on public.turfmate_records for select to anon,authenticated using(collection in ('turfmate:teams','turfmate:matches') or owner_id=auth.uid());
drop policy if exists "owners create records" on public.turfmate_records;
create policy "owners create records" on public.turfmate_records for insert to authenticated with check(owner_id=auth.uid() and collection in ('turfmate:teams','turfmate:matches','turfmate:booking-requests'));
drop policy if exists "team and booking owners update" on public.turfmate_records;
create policy "team and booking owners update" on public.turfmate_records for update to authenticated using(owner_id=auth.uid() and collection in ('turfmate:teams','turfmate:booking-requests')) with check(owner_id=auth.uid() and collection in ('turfmate:teams','turfmate:booking-requests'));
drop policy if exists "owners delete records" on public.turfmate_records;
create policy "owners delete records" on public.turfmate_records for delete to authenticated using(owner_id=auth.uid() and collection in ('turfmate:teams','turfmate:booking-requests'));

drop policy if exists "invitation participants read" on public.team_invitations;
create policy "invitation participants read" on public.team_invitations for select to authenticated using(inviter_id=auth.uid() or invitee_id=auth.uid());
drop policy if exists "invitation recipients respond" on public.team_invitations;
create policy "invitation recipients respond" on public.team_invitations for update to authenticated using(invitee_id=auth.uid()) with check(invitee_id=auth.uid());
drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications for select to authenticated using(recipient_id=auth.uid());
drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());

grant select,insert,update on public.profiles to authenticated;
grant select,insert,update,delete on public.turfmate_records to authenticated;
grant select on public.turfmate_records to anon;
grant select,update on public.team_invitations to authenticated;
grant select,update on public.notifications to authenticated;
grant execute on function public.tm_public_profiles() to anon,authenticated;

create or replace function public.tm_update_match_lineups(p_record_id text,p_lineups jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb;
begin
  update public.turfmate_records set data=jsonb_set(data,'{lineups}',coalesce(p_lineups,'{}'::jsonb),true)
  where collection='turfmate:matches' and record_id=p_record_id and owner_id=auth.uid() and data->>'status' in ('scheduled','live')
  returning data into v_data;
  if v_data is null then raise exception 'Match not found or you are not allowed to edit its line-up.'; end if;
  return v_data;
end; $$;

create or replace function public.tm_join_match(p_record_id text,p_side text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb; v_profile public.profiles%rowtype; v_roster jsonb; v_player jsonb; v_limit int;
begin
  if p_side not in ('home','away') then raise exception 'Choose a valid side.'; end if;
  select * into v_profile from public.profiles where id=auth.uid();
  if v_profile.id is null then raise exception 'Complete your player profile first.'; end if;
  select data into v_data from public.turfmate_records where collection='turfmate:matches' and record_id=p_record_id for update;
  if v_data is null or v_data->>'status'<>'scheduled' or coalesce((v_data->>'openToPlayers')::boolean,false)=false then raise exception 'This match is no longer open.'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(v_data->'homePlayers','[]'::jsonb)||coalesce(v_data->'awayPlayers','[]'::jsonb)) p where p->>'accountId'=auth.uid()::text) then raise exception 'You have already joined this match.'; end if;
  v_roster:=coalesce(v_data->(p_side||'Players'),'[]'::jsonb);
  v_limit:=coalesce((v_data->>'playersPerSide')::int,5);
  if jsonb_array_length(v_roster)>=v_limit then raise exception 'This side is already full.'; end if;
  v_player:=jsonb_build_object('accountId',auth.uid(),'name',v_profile.full_name,'position',v_profile.position,'area',v_profile.area,'skillLevel',v_profile.skill_level,'joinedAt',now());
  v_data:=jsonb_set(v_data,array[p_side||'Players'],v_roster||jsonb_build_array(v_player),true);
  update public.turfmate_records set data=v_data where collection='turfmate:matches' and record_id=p_record_id;
  return v_data;
end; $$;

create or replace function public.tm_leave_match(p_record_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb; v_side text;
begin
  select data into v_data from public.turfmate_records where collection='turfmate:matches' and record_id=p_record_id for update;
  if v_data is null or v_data->>'status'<>'scheduled' then raise exception 'You cannot leave this match now.'; end if;
  if v_data->>'creatorId'=auth.uid()::text then raise exception 'The match organiser cannot leave their own fixture.'; end if;
  foreach v_side in array array['home','away'] loop
    v_data:=jsonb_set(v_data,array[v_side||'Players'],coalesce((select jsonb_agg(p) from jsonb_array_elements(coalesce(v_data->(v_side||'Players'),'[]'::jsonb)) p where p->>'accountId'<>auth.uid()::text),'[]'::jsonb),true);
  end loop;
  update public.turfmate_records set data=v_data where collection='turfmate:matches' and record_id=p_record_id;
  return v_data;
end; $$;

create or replace function public.tm_start_match(p_record_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb;
begin
  update public.turfmate_records set data=data||jsonb_build_object('status','live','startedAt',now(),'homeScore',0,'awayScore',0)
  where collection='turfmate:matches' and record_id=p_record_id and owner_id=auth.uid() and data->>'status'='scheduled'
  returning data into v_data;
  if v_data is null then raise exception 'Only the organiser can start a scheduled match.'; end if;
  return v_data;
end; $$;

create or replace function public.tm_record_goal(p_record_id text,p_side text,p_scorer_id uuid,p_assist_id uuid,p_minute int)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb; v_roster jsonb; v_goal jsonb; v_field text; v_scorer text; v_assist text;
begin
  if p_side not in ('home','away') then raise exception 'Choose a valid team.'; end if;
  select data into v_data from public.turfmate_records where collection='turfmate:matches' and record_id=p_record_id and owner_id=auth.uid() for update;
  if v_data is null or v_data->>'status'<>'live' then raise exception 'Only the organiser can update a live match.'; end if;
  v_roster:=coalesce(v_data->(p_side||'Players'),'[]'::jsonb);
  select p->>'name' into v_scorer from jsonb_array_elements(v_roster) p where p->>'accountId'=p_scorer_id::text limit 1;
  if v_scorer is null then raise exception 'The scorer must be in the selected team.'; end if;
  if p_assist_id is not null and p_assist_id=p_scorer_id then raise exception 'The scorer and assister must be different players.'; end if;
  if p_assist_id is not null and not exists(select 1 from jsonb_array_elements(v_roster) p where p->>'accountId'=p_assist_id::text) then raise exception 'The assister must be in the selected team.'; end if;
  select p->>'name' into v_assist from jsonb_array_elements(v_roster) p where p->>'accountId'=p_assist_id::text limit 1;
  v_goal:=jsonb_build_object('id','goal_'||gen_random_uuid(),'side',p_side,'minute',greatest(0,least(coalesce(p_minute,0),150)),'scorerId',p_scorer_id,'scorerName',v_scorer,'assistId',coalesce(p_assist_id::text,''),'assistName',coalesce(v_assist,''),'createdAt',now());
  v_field:=p_side||'Score';
  v_data:=jsonb_set(v_data,'{goalEvents}',coalesce(v_data->'goalEvents','[]'::jsonb)||jsonb_build_array(v_goal),true);
  v_data:=jsonb_set(v_data,array[v_field],to_jsonb(coalesce((v_data->>v_field)::int,0)+1),true);
  v_data:=jsonb_set(v_data,'{lastScoreUpdate}',to_jsonb(now()),true);
  update public.turfmate_records set data=v_data where collection='turfmate:matches' and record_id=p_record_id;
  return v_data;
end; $$;

create or replace function public.tm_finish_match(p_record_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb; v_h int; v_a int; v_result text;
begin
  select data into v_data from public.turfmate_records where collection='turfmate:matches' and record_id=p_record_id and owner_id=auth.uid() for update;
  if v_data is null or v_data->>'status'<>'live' then raise exception 'Only the organiser can finish a live match.'; end if;
  v_h:=coalesce((v_data->>'homeScore')::int,0);v_a:=coalesce((v_data->>'awayScore')::int,0);
  v_result:=case when v_h=v_a then 'Draw' when v_h>v_a then coalesce(v_data->>'homeTeamName','Home team')||' won' else coalesce(v_data->>'awayTeamName','Away team')||' won' end;
  v_data:=v_data||jsonb_build_object('status','completed','completedAt',now(),'openToPlayers',false,'result',v_result);
  update public.turfmate_records set data=v_data where collection='turfmate:matches' and record_id=p_record_id;
  return v_data;
end; $$;

create table if not exists public.match_votes(
  id uuid primary key default gen_random_uuid(),
  match_record_id text not null,
  voter_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(match_record_id,voter_id)
);
alter table public.match_votes enable row level security;
drop policy if exists "participants can read votes" on public.match_votes;
create policy "participants can read votes" on public.match_votes for select to authenticated using(voter_id=auth.uid() or player_id=auth.uid());
grant select on public.match_votes to authenticated;

create or replace function public.tm_vote_motm(p_record_id text,p_player_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb; v_participants jsonb; v_vote jsonb;
begin
  select data into v_data from public.turfmate_records where collection='turfmate:matches' and record_id=p_record_id for update;
  if v_data is null or v_data->>'status'<>'completed' then raise exception 'Voting is only available after a match is completed.'; end if;
  v_participants:=coalesce(v_data->'homePlayers','[]'::jsonb)||coalesce(v_data->'awayPlayers','[]'::jsonb);
  if not exists(select 1 from jsonb_array_elements(v_participants) p where p->>'accountId'=auth.uid()::text) then raise exception 'Only players in this match can vote.'; end if;
  if p_player_id=auth.uid() then raise exception 'You cannot vote for yourself.'; end if;
  if not exists(select 1 from jsonb_array_elements(v_participants) p where p->>'accountId'=p_player_id::text) then raise exception 'Choose a player who took part in this match.'; end if;
  insert into public.match_votes(match_record_id,voter_id,player_id) values(p_record_id,auth.uid(),p_player_id);
  v_vote:=jsonb_build_object('voterId',auth.uid(),'playerId',p_player_id,'createdAt',now());
  v_data:=jsonb_set(v_data,'{motmVotes}',coalesce(v_data->'motmVotes','[]'::jsonb)||jsonb_build_array(v_vote),true);
  update public.turfmate_records set data=v_data where collection='turfmate:matches' and record_id=p_record_id;
  return v_data;
exception when unique_violation then raise exception 'You have already voted in this match.';
end; $$;

create or replace function public.tm_invite_player(p_team_id text,p_invitee_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_team jsonb;v_inviter text;v_invitee public.profiles%rowtype;v_invite public.team_invitations%rowtype;
begin
  select data into v_team from public.turfmate_records where collection='turfmate:teams' and record_id=p_team_id and owner_id=auth.uid() for update;
  if v_team is null then raise exception 'Only the team captain can invite players.'; end if;
  if p_invitee_id=auth.uid() then raise exception 'You cannot invite yourself.'; end if;
  select * into v_invitee from public.profiles where id=p_invitee_id and public_profile=true;
  if v_invitee.id is null then raise exception 'This player is not available for invitations.'; end if;
  v_inviter:=coalesce(v_team->>'ownerName','Team captain');
  insert into public.team_invitations(team_id,team_name,inviter_id,inviter_name,invitee_id)
  values(p_team_id,coalesce(v_team->>'name','Team'),auth.uid(),v_inviter,p_invitee_id)
  returning * into v_invite;
  insert into public.notifications(recipient_id,actor_id,type,title,body,data)
  values(p_invitee_id,auth.uid(),'team_invitation','Team invitation',v_inviter||' invited you to join '||coalesce(v_team->>'name','a team'),jsonb_build_object('invitationId',v_invite.id,'teamId',p_team_id));
  return to_jsonb(v_invite);
exception when unique_violation then raise exception 'An invitation already exists for this player and team.';
end; $$;

create or replace function public.tm_respond_team_invite(p_invite_id uuid,p_accept boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_invite public.team_invitations%rowtype;v_profile public.profiles%rowtype;v_team jsonb;
begin
  select * into v_invite from public.team_invitations where id=p_invite_id and invitee_id=auth.uid() for update;
  if v_invite.id is null or v_invite.status<>'pending' then raise exception 'This invitation is no longer available.'; end if;
  update public.team_invitations set status=case when p_accept then 'accepted' else 'declined' end,responded_at=now() where id=p_invite_id returning * into v_invite;
  if p_accept then
    select * into v_profile from public.profiles where id=auth.uid();
    select data into v_team from public.turfmate_records where collection='turfmate:teams' and record_id=v_invite.team_id for update;
    if v_team is not null and not exists(select 1 from jsonb_array_elements(coalesce(v_team->'members','[]'::jsonb)) m where m->>'accountId'=auth.uid()::text) then
      v_team:=jsonb_set(v_team,'{members}',coalesce(v_team->'members','[]'::jsonb)||jsonb_build_array(jsonb_build_object('accountId',auth.uid(),'name',v_profile.full_name,'role','Player','joinedAt',now())),true);
      update public.turfmate_records set data=v_team where collection='turfmate:teams' and record_id=v_invite.team_id;
    end if;
  end if;
  insert into public.notifications(recipient_id,actor_id,type,title,body,data)
  values(v_invite.inviter_id,auth.uid(),'team_invitation_response','Team invitation update',coalesce((select full_name from public.profiles where id=auth.uid()),'A player')||case when p_accept then ' joined ' else ' declined ' end||v_invite.team_name,jsonb_build_object('invitationId',v_invite.id,'teamId',v_invite.team_id,'status',v_invite.status));
  return to_jsonb(v_invite);
end; $$;

create or replace function public.tm_notify_match_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_type text;v_title text;v_body text;v_players jsonb;
begin
  if new.collection<>'turfmate:matches' then return new; end if;
  if old.data->>'status' is distinct from new.data->>'status' then
    if new.data->>'status'='live' then v_type:='match_started';v_title:='Match started';v_body:=coalesce(new.data->>'homeTeamName','Home')||' vs '||coalesce(new.data->>'awayTeamName','Away')||' is now live.';
    elsif new.data->>'status'='completed' then v_type:='match_finished';v_title:='Match completed';v_body:='Final score: '||coalesce(new.data->>'homeScore','0')||' - '||coalesce(new.data->>'awayScore','0');
    else return new; end if;
  elsif new.data->>'homeScore' is distinct from old.data->>'homeScore' or new.data->>'awayScore' is distinct from old.data->>'awayScore' then
    v_type:='goal_scored';v_title:='Goal scored';v_body:=coalesce(new.data->>'homeTeamName','Home')||' '||coalesce(new.data->>'homeScore','0')||' - '||coalesce(new.data->>'awayScore','0')||' '||coalesce(new.data->>'awayTeamName','Away');
  else return new; end if;
  v_players:=coalesce(new.data->'homePlayers','[]'::jsonb)||coalesce(new.data->'awayPlayers','[]'::jsonb);
  insert into public.notifications(recipient_id,actor_id,type,title,body,data)
  select distinct (p->>'accountId')::uuid,new.owner_id,v_type,v_title,v_body,jsonb_build_object('matchId',new.record_id)
  from jsonb_array_elements(v_players) p
  where p->>'accountId' is not null and p->>'accountId'<>new.owner_id::text;
  return new;
end; $$;
drop trigger if exists turfmate_match_notifications on public.turfmate_records;
create trigger turfmate_match_notifications after update on public.turfmate_records for each row execute function public.tm_notify_match_change();

create or replace function public.tm_mark_notification_read(p_notification_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.notifications set read_at=now() where id=p_notification_id and recipient_id=auth.uid();
  if not found then raise exception 'Notification not found.'; end if;
end; $$;

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

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('player-avatars','player-avatars',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "avatar images are public" on storage.objects;
create policy "avatar images are public" on storage.objects for select to anon,authenticated using(bucket_id='player-avatars');
drop policy if exists "players upload own avatar" on storage.objects;
create policy "players upload own avatar" on storage.objects for insert to authenticated with check(bucket_id='player-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "players update own avatar" on storage.objects;
create policy "players update own avatar" on storage.objects for update to authenticated using(bucket_id='player-avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='player-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "players delete own avatar" on storage.objects;
create policy "players delete own avatar" on storage.objects for delete to authenticated using(bucket_id='player-avatars' and (storage.foldername(name))[1]=auth.uid()::text);

do $$ begin
  alter publication supabase_realtime add table public.turfmate_records;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.team_invitations;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- IMPORTANT: Keep the Supabase service_role key server-side. Only the anon/publishable key belongs in backend-config.js.
