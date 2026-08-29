create table public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  prompt text not null,
  instruction text not null,
  unit text not null,
  correct_answer numeric not null,
  answer_tolerance numeric not null default 0.01 check (answer_tolerance >= 0),
  hint text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_duration_minutes smallint not null check (requested_duration_minutes between 1 and 180),
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'completed' and completed_at is not null) or status <> 'completed')
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  attempt_number smallint not null check (attempt_number > 0),
  submitted_answer numeric not null,
  is_correct boolean not null,
  used_hint boolean not null default false,
  response_time_ms integer not null check (response_time_ms >= 0),
  created_at timestamptz not null default now(),
  unique (session_id, question_id, attempt_number)
);

create index practice_sessions_user_started_idx on public.practice_sessions (user_id, started_at desc);
create index attempts_user_created_idx on public.attempts (user_id, created_at desc);
create index attempts_session_idx on public.attempts (session_id);

alter table public.questions enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.attempts enable row level security;

revoke all on table public.questions, public.practice_sessions, public.attempts from anon, authenticated;
grant select on table public.questions to authenticated;
grant select, insert, update on table public.practice_sessions to authenticated;
grant select, insert on table public.attempts to authenticated;

create policy "Authenticated users can read active questions"
on public.questions for select
to authenticated
using (is_active);

create policy "Users can read their own sessions"
on public.practice_sessions for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own sessions"
on public.practice_sessions for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own sessions"
on public.practice_sessions for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their own attempts"
on public.attempts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create attempts in their own sessions"
on public.attempts for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.practice_sessions
    where practice_sessions.id = session_id
      and practice_sessions.user_id = (select auth.uid())
      and practice_sessions.status = 'active'
  )
);
