create table public.weekly_goal_settings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  effective_week date not null,
  target_sessions smallint not null check (target_sessions in (1, 3, 5, 7)),
  created_at timestamptz not null default now(),
  primary key (user_id, effective_week)
);

insert into public.weekly_goal_settings (user_id, effective_week, target_sessions)
select id, date_trunc('week', now())::date, 3
from public.profiles;

alter table public.weekly_goal_settings enable row level security;

revoke all on table public.weekly_goal_settings from anon, authenticated;
grant select, insert, update, delete on table public.weekly_goal_settings to authenticated;

create policy "Users can read their weekly goals"
on public.weekly_goal_settings for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can add their weekly goals"
on public.weekly_goal_settings for insert
to authenticated
with check ((select auth.uid()) = user_id and effective_week > current_date);

create policy "Users can update future weekly goals"
on public.weekly_goal_settings for update
to authenticated
using ((select auth.uid()) = user_id and effective_week > current_date)
with check ((select auth.uid()) = user_id and effective_week > current_date);

create policy "Users can delete future weekly goals"
on public.weekly_goal_settings for delete
to authenticated
using ((select auth.uid()) = user_id and effective_week > current_date);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.weekly_goal_settings (user_id, effective_week, target_sessions)
  values (new.id, date_trunc('week', now())::date, 3);

  return new;
end;
$$;
