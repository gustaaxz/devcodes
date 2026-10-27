alter table public.tags
  add column color text not null default '#64748b'
    check (color ~ '^#[0-9A-Fa-f]{6}$'),
  add column is_favorite boolean not null default false;

create table public.task_tags (
  task_id uuid not null references public.tasks (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

create index task_tags_tag_idx on public.task_tags (tag_id);

alter table public.task_tags enable row level security;

create policy task_tags_select_own on public.task_tags
  for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  ));

create policy task_tags_insert_own on public.task_tags
  for insert to authenticated
  with check (
    exists (select 1 from public.tasks t where t.id = task_id and t.user_id = (select auth.uid()))
    and exists (select 1 from public.tags g where g.id = tag_id and g.user_id = (select auth.uid()))
  );

create policy task_tags_delete_own on public.task_tags
  for delete to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  ));

create or replace function public.cleanup_unused_tag_after_unlink()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  delete from public.tags tag
  where tag.id = old.tag_id
    and not tag.is_favorite
    and not exists (select 1 from public.note_tags link where link.tag_id = old.tag_id)
    and not exists (select 1 from public.task_tags link where link.tag_id = old.tag_id)
    and not exists (select 1 from public.file_tags link where link.tag_id = old.tag_id);
  return old;
end;
$$;

revoke all on function public.cleanup_unused_tag_after_unlink() from public, anon, authenticated;

create trigger note_tags_cleanup_unused_tag
  after delete on public.note_tags
  for each row execute function public.cleanup_unused_tag_after_unlink();

create trigger task_tags_cleanup_unused_tag
  after delete on public.task_tags
  for each row execute function public.cleanup_unused_tag_after_unlink();

create trigger file_tags_cleanup_unused_tag
  after delete on public.file_tags
  for each row execute function public.cleanup_unused_tag_after_unlink();
