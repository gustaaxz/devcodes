-- Align projects that have username but still retain the legacy display_name column.
-- This makes the signup trigger from 20261027100000_restore_signup_defaults.sql compatible
-- with databases where the username migration was only partially applied.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    alter table public.profiles rename column display_name to full_name;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) then
    alter table public.profiles add column full_name text;
  end if;

  alter table public.profiles add column if not exists username text;
end;
$$;
