insert into storage.buckets (id, name, public, file_size_limit)
values ('programming-files', 'programming-files', false, 10485760)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit;

create policy programming_files_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'programming-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy programming_files_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'programming-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy programming_files_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'programming-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'programming-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy programming_files_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'programming-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
