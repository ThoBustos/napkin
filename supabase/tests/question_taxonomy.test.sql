begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(12);

insert into auth.users (id) values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
insert into questions (id, slug, category, prompt, instruction, unit, correct_answer, hint)
values ('10000000-0000-0000-0000-000000000001', 'test-legacy', 'Legacy', 'Legacy?', 'Enter answer', '%', 1, 'Hint');
insert into questions (id, slug, category, prompt, instruction, unit, correct_answer, hint, executive_track, category_slug, number_friendliness, operation_count, publication_status)
select ('10000000-0000-0000-0000-00000000000' || n)::uuid, 'test-' || status, 'CEO', 'Question?', 'Enter answer', '%', 1, 'Hint', 'ceo', 'capital-allocation', 1, 1, status
from (values (2, 'draft'), (3, 'approved'), (4, 'published'), (5, 'retired')) as states(n, status);
insert into practice_sessions (id, user_id, requested_duration_minutes)
values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 10);
insert into attempts (session_id, question_id, user_id, attempt_number, submitted_answer, is_correct, response_time_ms)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 1, 1, true, 1000);

select throws_ok($$update questions set executive_track = 'invalid' where slug = 'test-published'$$, '23514', null, 'Reject invalid track');
select throws_ok($$update questions set category_slug = 'activation' where slug = 'test-published'$$, '23514', null, 'Reject category outside track');
select throws_ok($$update questions set difficulty = 4 where slug = 'test-published'$$, '23514', null, 'Executive difficulty is 1 to 3');
select lives_ok($$update questions set difficulty = 5 where slug = 'test-legacy'$$, 'Legacy difficulty remains compatible');
select throws_ok($$update questions set operation_count = null where slug = 'test-published'$$, '23514', null, 'Reject incomplete metadata');
select throws_ok($$update practice_sessions set selected_tracks = array['invalid'] where id = '20000000-0000-0000-0000-000000000001'$$, '23514', null, 'Reject invalid session tracks');
select throws_ok($$update practice_sessions set selected_tracks = array['cfo', 'cfo'] where id = '20000000-0000-0000-0000-000000000001'$$, '23514', null, 'Reject duplicate session tracks');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select results_eq($$select slug from questions where slug like 'test-%' order by slug$$, array['test-legacy', 'test-published', 'test-retired'], 'User sees published, legacy and own retired history, never drafts');
select throws_ok($$update questions set prompt = 'Changed' where slug = 'test-published'$$, '42501', null, 'Browser cannot author questions');
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
select results_eq($$select slug from questions where slug like 'test-%' order by slug$$, array['test-legacy', 'test-published'], 'Other user cannot read retired history');
select is((select count(*) from practice_sessions where id = '20000000-0000-0000-0000-000000000001'), 0::bigint, 'Session ownership is preserved');
set local role anon;
select throws_ok($$select * from questions$$, '42501', null, 'Anonymous users cannot read questions');
reset role;
select * from finish();
rollback;
