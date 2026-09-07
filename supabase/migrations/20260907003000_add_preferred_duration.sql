alter table public.profiles
  add column preferred_duration_minutes smallint not null default 10
    check (preferred_duration_minutes between 1 and 180);

comment on column public.profiles.preferred_duration_minutes is
  'Last saved normal practice duration in whole minutes. Quick Start stays at 10.';

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
