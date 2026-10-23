create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  category_id uuid references public.categories (id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  description text,
  category_id uuid references public.categories (id) on delete set null,
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 200),
  content text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  linked_date date,
  is_favorite boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.note_tags (
  note_id uuid not null references public.notes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (note_id, tag_id)
);

create table public.programming_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  unique (user_id, name)
);

create table public.stored_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.programming_categories (id) on delete restrict,
  original_name text not null check (char_length(trim(original_name)) between 1 and 255),
  storage_key text not null unique,
  extension text,
  mime_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  description text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.file_tags (
  file_id uuid not null references public.stored_files (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (file_id, tag_id)
);

create index categories_user_idx on public.categories (user_id);
create index tags_user_idx on public.tags (user_id);
create index events_user_start_idx on public.events (user_id, start_at);
create index events_category_idx on public.events (category_id);
create index tasks_user_due_idx on public.tasks (user_id, due_at);
create index tasks_user_status_idx on public.tasks (user_id, status);
create index tasks_category_idx on public.tasks (category_id);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_user_linked_date_idx on public.notes (user_id, linked_date);
create index notes_category_idx on public.notes (category_id);
create index note_tags_tag_idx on public.note_tags (tag_id);
create index programming_categories_user_position_idx on public.programming_categories (user_id, position);
create index stored_files_user_category_idx on public.stored_files (user_id, category_id);
create index stored_files_user_created_idx on public.stored_files (user_id, created_at desc);
create index stored_files_user_favorite_idx on public.stored_files (user_id) where is_favorite;
create index file_tags_tag_idx on public.file_tags (tag_id);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger programming_categories_set_updated_at before update on public.programming_categories
  for each row execute function public.set_updated_at();
create trigger stored_files_set_updated_at before update on public.stored_files
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''));

  insert into public.programming_categories (user_id, name, slug, position)
  values
    (new.id, 'JavaScript', 'javascript', 0),
    (new.id, 'HTML', 'html', 1),
    (new.id, 'CSS', 'css', 2),
    (new.id, 'React', 'react', 3),
    (new.id, 'Java', 'java', 4),
    (new.id, 'Node.js', 'nodejs', 5),
    (new.id, 'SQL', 'sql', 6),
    (new.id, 'Python', 'python', 7),
    (new.id, 'TypeScript', 'typescript', 8),
    (new.id, 'Outras tecnologias', 'outras-tecnologias', 9);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
