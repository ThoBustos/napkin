begin;
set search_path = public, extensions;
select plan(11);

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000031'),
  ('00000000-0000-0000-0000-000000000032');
insert into questions (id, slug, category, prompt, instruction, unit, correct_answer, answer_tolerance, hint)
values ('10000000-0000-0000-0000-000000000031', 'secure-attempt-question', 'Test', 'Two plus two?', 'Enter answer', '', 4, 0.01, 'Add both numbers');
insert into practice_sessions (id, user_id, requested_duration_minutes)
values ('20000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000031', 10);

select is(has_column_privilege('authenticated', 'questions', 'prompt', 'select'), true, 'Browser can read question prompts');
select is(has_column_privilege('authenticated', 'questions', 'correct_answer', 'select'), false, 'Browser cannot read canonical answers');
select is(has_table_privilege('authenticated', 'attempts', 'insert'), false, 'Browser cannot insert attempts directly');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000031';
select is((select is_correct from submit_practice_attempt('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', 3, false, 1000)), false, 'Database rejects an incorrect answer');
select is((select attempt_number from submit_practice_attempt('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', 4, true, 1200)), 2::smallint, 'Database assigns the next attempt number');
select is((select count(*) from attempts where session_id = '20000000-0000-0000-0000-000000000031' and user_id = '00000000-0000-0000-0000-000000000031'), 2::bigint, 'Attempts are attributed to the authenticated owner');
select is((select count(*) from attempts where session_id = '20000000-0000-0000-0000-000000000031' and is_correct), 1::bigint, 'Database stores calculated correctness');

update practice_sessions set status = 'completed', completed_at = now() where id = '20000000-0000-0000-0000-000000000031';
select is((select correct_answer::integer from get_practice_history() limit 1), 4, 'Owner history includes the answer after completing the session');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000032';
select is((select count(*) from get_practice_history()), 0::bigint, 'Other users cannot read the history');
select throws_ok($$select * from submit_practice_attempt('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000031', 4, false, 1000)$$, '42501', null, 'Other users cannot submit into the session');

reset role;
select is(has_function_privilege('anon', 'get_practice_history()', 'execute'), false, 'Anonymous users cannot execute history RPC');
select * from finish();
rollback;
