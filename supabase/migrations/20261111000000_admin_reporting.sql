-- Membership is managed by an operator, never by browser code or user metadata.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated;

create function public.is_napkin_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from private.admin_users where user_id = (select auth.uid())); $$;
revoke all on function public.is_napkin_admin() from public, anon;
grant execute on function public.is_napkin_admin() to authenticated;

create index if not exists practice_sessions_started_at_idx on public.practice_sessions(started_at);

create function public.admin_overview(p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not public.is_napkin_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_days not in (7,30) or p_days is null then raise exception 'Invalid reporting period' using errcode = '22023'; end if;
  with sessions as (
    select * from public.practice_sessions where started_at >= ((now() at time zone 'UTC')::date - (p_days-1)) at time zone 'UTC'
  ), totals as (
    select count(*) as started, count(*) filter(where status = 'completed') as completed,
      count(distinct user_id) as active_users,
      coalesce(sum(greatest(extract(epoch from (completed_at-started_at)),0)) filter(where status='completed'),0) / 60 as minutes
    from sessions
  ), daily as (
    select d::date as day, count(s.id) filter(where s.status='completed') as sessions
    from generate_series((now() at time zone 'UTC')::date - (p_days-1), (now() at time zone 'UTC')::date, interval '1 day') d
    left join sessions s on (s.started_at at time zone 'UTC')::date = d::date
    group by d order by d
  )
  select jsonb_build_object(
    'totalUsers', (select count(*) from auth.users where deleted_at is null),
    'newUsers', (select count(*) from auth.users where deleted_at is null and created_at >= (((now() at time zone 'UTC')::date - (p_days-1)) at time zone 'UTC')),
    'activeUsers', active_users, 'startedSessions', started, 'completedSessions', completed,
    'practiceMinutes', round(minutes),
    'completionRate', case when started > 0 then round(completed*100.0/started) else 0 end,
    'daily', (select jsonb_agg(jsonb_build_object('day', day, 'sessions', sessions)) from daily)
  ) into result from totals;
  return result;
end; $$;

create function public.admin_users(p_search text default '', p_page integer default 0) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not public.is_napkin_admin() then raise exception 'Admin access required' using errcode = '42501'; end if;
  if p_page is null or p_page < 0 or p_page > 100000 or length(p_search) > 100 then raise exception 'Invalid pagination' using errcode = '22023'; end if;
  with matched as (
    select id, email, coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name','') as name, created_at
    from auth.users
    where deleted_at is null and (coalesce(p_search,'')='' or position(lower(p_search) in lower(coalesce(email,'') || ' ' || coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',''))) > 0)
  ), page as (
    select * from matched order by created_at desc, id limit 25 offset p_page*25
  ), rows as (
    select u.*, s.last_practice, s.sessions, s.minutes from page u
    cross join lateral (
      select max(started_at) as last_practice, count(*) filter(where status='completed') as sessions,
      round(coalesce(sum(greatest(extract(epoch from (completed_at-started_at)),0)) filter(where status='completed'),0)/60) as minutes
      from public.practice_sessions where user_id=u.id
    ) s
  )
  select jsonb_build_object('total', (select count(*) from matched), 'users', coalesce((
    select jsonb_agg(jsonb_build_object('id',id,'name',name,'email',email,'createdAt',created_at,'lastPractice',last_practice,'sessions',sessions,'minutes',minutes) order by created_at desc,id) from rows
  ),'[]'::jsonb)) into result;
  return result;
end; $$;
revoke all on function public.admin_overview(integer), public.admin_users(text,integer) from public, anon;
grant execute on function public.admin_overview(integer), public.admin_users(text,integer) to authenticated;
