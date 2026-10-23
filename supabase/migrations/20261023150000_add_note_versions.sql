-- Create note_versions table to track note history
create table public.note_versions (
  id uuid default gen_random_uuid() primary key,
  note_id uuid not null references public.notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.note_versions enable row level security;

-- Create RLS policies
create policy note_versions_select_own on public.note_versions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy note_versions_insert_own on public.note_versions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Create indexes
create index note_versions_note_id_idx on public.note_versions (note_id);
create index note_versions_user_id_idx on public.note_versions (user_id);
create index note_versions_created_at_idx on public.note_versions (created_at desc);

-- Create trigger to save version on note update
create or replace function public.save_note_version()
returns trigger as $$
begin
  insert into public.note_versions (note_id, user_id, title, content)
  values (new.id, new.user_id, new.title, new.content);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger note_versions_on_update
after update on public.notes
for each row
when (old.content is distinct from new.content)
execute function public.save_note_version();
