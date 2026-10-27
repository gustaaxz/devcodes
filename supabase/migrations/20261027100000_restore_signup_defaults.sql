-- Restore the default categories removed when handle_new_user was updated for usernames.
-- Existing users receive defaults only when they currently have no categories.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    lower(nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), ''))
  );

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
    (new.id, 'Outras tecnologias', 'outras-tecnologias', 9)
  on conflict (user_id, slug) do nothing;

  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Trabalho escolar', '#3b82f6'),
    (new.id, 'Apresentação', '#a855f7'),
    (new.id, 'Prova', '#ef4444'),
    (new.id, 'Entrega de projeto', '#f59e0b'),
    (new.id, 'Compromisso pessoal', '#22c55e'),
    (new.id, 'Estudo', '#06b6d4')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

insert into public.programming_categories (user_id, name, slug, position)
select users.id, defaults.name, defaults.slug, defaults.position
from auth.users as users
cross join (
  values
    ('JavaScript', 'javascript', 0),
    ('HTML', 'html', 1),
    ('CSS', 'css', 2),
    ('React', 'react', 3),
    ('Java', 'java', 4),
    ('Node.js', 'nodejs', 5),
    ('SQL', 'sql', 6),
    ('Python', 'python', 7),
    ('TypeScript', 'typescript', 8),
    ('Outras tecnologias', 'outras-tecnologias', 9)
) as defaults(name, slug, position)
where not exists (
  select 1
  from public.programming_categories as existing
  where existing.user_id = users.id
)
on conflict (user_id, slug) do nothing;

insert into public.categories (user_id, name, color)
select users.id, defaults.name, defaults.color
from auth.users as users
cross join (
  values
    ('Trabalho escolar', '#3b82f6'),
    ('Apresentação', '#a855f7'),
    ('Prova', '#ef4444'),
    ('Entrega de projeto', '#f59e0b'),
    ('Compromisso pessoal', '#22c55e'),
    ('Estudo', '#06b6d4')
) as defaults(name, color)
where not exists (
  select 1
  from public.categories as existing
  where existing.user_id = users.id
)
on conflict (user_id, name) do nothing;
