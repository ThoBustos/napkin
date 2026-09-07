-- Browsers may read question content, but canonical answers remain server-only.
revoke select on table public.questions from authenticated;
grant select (
  id, slug, category, difficulty, prompt, instruction, unit, hint, is_active,
  created_at, updated_at, executive_track, category_slug, number_friendliness,
  operation_count, publication_status
) on table public.questions to authenticated;

-- Attempts must be scored and attributed by the database.
revoke insert on table public.attempts from authenticated;

create function public.submit_practice_attempt(
  p_session_id uuid,
  p_question_id uuid,
  p_submitted_answer numeric,
  p_used_hint boolean,
  p_response_time_ms integer
)
returns table (is_correct boolean, correct_answer numeric, attempt_number smallint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  question_answer numeric;
  question_tolerance numeric;
  next_attempt smallint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_response_time_ms < 0 then
    raise exception 'Response time cannot be negative' using errcode = '22023';
  end if;

  select q.correct_answer, q.answer_tolerance
    into question_answer, question_tolerance
  from public.practice_sessions as session
  join public.questions as q on q.id = p_question_id
  where session.id = p_session_id
    and session.user_id = auth.uid()
    and session.status = 'active'
    and q.is_active
    and (q.publication_status = 'published' or (q.executive_track is null and q.publication_status is null))
    and (session.selected_tracks is null or q.executive_track is null or q.executive_track = any(session.selected_tracks))
  for update of session;

  if not found then
    raise exception 'Active session or eligible question not found' using errcode = '42501';
  end if;

  select (count(*) + 1)::smallint into next_attempt
  from public.attempts
  where session_id = p_session_id and question_id = p_question_id;

  insert into public.attempts (
    session_id, question_id, user_id, attempt_number, submitted_answer,
    is_correct, used_hint, response_time_ms
  ) values (
    p_session_id, p_question_id, auth.uid(), next_attempt, p_submitted_answer,
    abs(p_submitted_answer - question_answer) <= question_tolerance,
    p_used_hint, p_response_time_ms
  );

  return query select
    abs(p_submitted_answer - question_answer) <= question_tolerance,
    question_answer,
    next_attempt;
end;
$$;

revoke execute on function public.submit_practice_attempt(uuid, uuid, numeric, boolean, integer) from public, anon;
grant execute on function public.submit_practice_attempt(uuid, uuid, numeric, boolean, integer) to authenticated;

create function public.get_practice_history()
returns table (
  session_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  question_id uuid,
  attempt_number smallint,
  submitted_answer numeric,
  is_correct boolean,
  used_hint boolean,
  prompt text,
  unit text,
  correct_answer numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    session.id, session.started_at, session.completed_at,
    attempt.question_id, attempt.attempt_number, attempt.submitted_answer,
    attempt.is_correct, attempt.used_hint, question.prompt, question.unit,
    question.correct_answer
  from public.practice_sessions as session
  join public.attempts as attempt on attempt.session_id = session.id
  join public.questions as question on question.id = attempt.question_id
  where auth.uid() is not null
    and session.user_id = auth.uid()
    and session.status = 'completed'
  order by session.started_at desc, attempt.created_at asc
$$;

revoke execute on function public.get_practice_history() from public, anon;
grant execute on function public.get_practice_history() to authenticated;
