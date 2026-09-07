-- Null means All, including tracks introduced in future catalog releases.
-- Existing profiles retain null until users explicitly save a preference.
alter table public.profiles
  add column preferred_tracks text[],
  add constraint profiles_preferred_tracks_check check (
    preferred_tracks is null or (
      array_ndims(preferred_tracks) = 1
      and cardinality(preferred_tracks) between 1 and 11
      and array_position(preferred_tracks, null) is null
      and public.text_array_has_unique_elements(preferred_tracks)
      and preferred_tracks <@ array[
        'ceo', 'coo', 'cfo', 'cro', 'cmo', 'cpo', 'cto', 'cio', 'chro', 'supply_chain', 'risk'
      ]::text[]
    )
  );

comment on column public.profiles.preferred_tracks is
  'Last saved executive focus. Null means All. No daily expiration.';

-- Existing profiles SELECT/UPDATE grants and owner-only RLS cover this field.
