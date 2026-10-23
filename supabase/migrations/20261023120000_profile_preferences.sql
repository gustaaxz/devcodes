alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb
  check (jsonb_typeof(preferences) = 'object');

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

insert into public.profiles (id)
select u.id from auth.users u
on conflict (id) do nothing;
