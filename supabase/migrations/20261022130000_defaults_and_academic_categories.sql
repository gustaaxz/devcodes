alter table public.categories alter column user_id set default auth.uid();
alter table public.tags alter column user_id set default auth.uid();
alter table public.events alter column user_id set default auth.uid();
alter table public.tasks alter column user_id set default auth.uid();
alter table public.notes alter column user_id set default auth.uid();
alter table public.programming_categories alter column user_id set default auth.uid();
alter table public.stored_files alter column user_id set default auth.uid();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''));

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

  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Trabalho escolar', '#3b82f6'),
    (new.id, 'Apresentação', '#a855f7'),
    (new.id, 'Prova', '#ef4444'),
    (new.id, 'Entrega de projeto', '#f59e0b'),
    (new.id, 'Compromisso pessoal', '#22c55e'),
    (new.id, 'Estudo', '#06b6d4');

  return new;
end;
$$;

insert into public.categories (user_id, name, color)
select u.id, d.name, d.color
from auth.users u
cross join (
  values
    ('Trabalho escolar', '#3b82f6'),
    ('Apresentação', '#a855f7'),
    ('Prova', '#ef4444'),
    ('Entrega de projeto', '#f59e0b'),
    ('Compromisso pessoal', '#22c55e'),
    ('Estudo', '#06b6d4')
) as d(name, color)
on conflict (user_id, name) do nothing;
