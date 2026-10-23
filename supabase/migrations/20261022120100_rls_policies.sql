alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.note_tags enable row level security;
alter table public.programming_categories enable row level security;
alter table public.stored_files enable row level security;
alter table public.file_tags enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy categories_select_own on public.categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy categories_insert_own on public.categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy categories_update_own on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy categories_delete_own on public.categories
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy tags_select_own on public.tags
  for select to authenticated using ((select auth.uid()) = user_id);
create policy tags_insert_own on public.tags
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy tags_update_own on public.tags
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy tags_delete_own on public.tags
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy events_select_own on public.events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy events_insert_own on public.events
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy events_update_own on public.events
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy events_delete_own on public.events
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy tasks_select_own on public.tasks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy tasks_insert_own on public.tasks
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy tasks_update_own on public.tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy tasks_delete_own on public.tasks
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy notes_select_own on public.notes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notes_insert_own on public.notes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy notes_update_own on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );
create policy notes_delete_own on public.notes
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy note_tags_select_own on public.note_tags
  for select to authenticated
  using (exists (
    select 1 from public.notes n
    where n.id = note_id and n.user_id = (select auth.uid())
  ));
create policy note_tags_insert_own on public.note_tags
  for insert to authenticated
  with check (
    exists (select 1 from public.notes n where n.id = note_id and n.user_id = (select auth.uid()))
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = (select auth.uid()))
  );
create policy note_tags_delete_own on public.note_tags
  for delete to authenticated
  using (exists (
    select 1 from public.notes n
    where n.id = note_id and n.user_id = (select auth.uid())
  ));

create policy programming_categories_select_own on public.programming_categories
  for select to authenticated using ((select auth.uid()) = user_id);
create policy programming_categories_insert_own on public.programming_categories
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy programming_categories_update_own on public.programming_categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy programming_categories_delete_own on public.programming_categories
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy stored_files_select_own on public.stored_files
  for select to authenticated using ((select auth.uid()) = user_id);
create policy stored_files_insert_own on public.stored_files
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.programming_categories pc
      where pc.id = category_id and pc.user_id = (select auth.uid())
    )
  );
create policy stored_files_update_own on public.stored_files
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.programming_categories pc
      where pc.id = category_id and pc.user_id = (select auth.uid())
    )
  );
create policy stored_files_delete_own on public.stored_files
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy file_tags_select_own on public.file_tags
  for select to authenticated
  using (exists (
    select 1 from public.stored_files f
    where f.id = file_id and f.user_id = (select auth.uid())
  ));
create policy file_tags_insert_own on public.file_tags
  for insert to authenticated
  with check (
    exists (select 1 from public.stored_files f where f.id = file_id and f.user_id = (select auth.uid()))
    and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = (select auth.uid()))
  );
create policy file_tags_delete_own on public.file_tags
  for delete to authenticated
  using (exists (
    select 1 from public.stored_files f
    where f.id = file_id and f.user_id = (select auth.uid())
  ));
