begin;
set search_path = public, extensions;
select plan(4);
select is((select count(*) from questions where executive_track is not null), 110::bigint, '110 executive questions');
select is((select count(distinct executive_track) from questions), 11::bigint, '11 executive tracks');
select is((select count(*) from (
  select executive_track from questions where executive_track is not null group by executive_track
  having count(*) = 10 and count(*) filter (where difficulty = 1) = 5
    and count(*) filter (where difficulty = 2) = 3 and count(*) filter (where difficulty = 3) = 2
) tracks), 11::bigint, 'Every track has the 5/3/2 distribution');
select is((select count(*) from questions where executive_track is not null and publication_status = 'published' and is_active), 110::bigint, 'Entire reviewed catalog is published');
select * from finish();
rollback;
