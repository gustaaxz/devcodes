begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('abababab-abab-4bab-8bab-abababababab', 'audit-a@example.test', '{"full_name":"Audit A"}'),
  ('bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc', 'audit-b@example.test', '{"full_name":"Audit B"}');

insert into public.tasks (id, user_id, title, description)
values
  ('11111111-aaaa-4aaa-8aaa-111111111111', 'abababab-abab-4bab-8bab-abababababab', 'Audit fixture A', 'private text A'),
  ('22222222-bbbb-4bbb-8bbb-222222222222', 'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc', 'Audit fixture B', 'private text B');

do $$
begin
  if (select relrowsecurity from pg_class where oid = 'public.audit_log'::regclass) is distinct from true then
    raise exception 'FAIL: RLS is not enabled on public.audit_log';
  end if;
  if (select count(*) from public.audit_log
      where entity_type = 'tasks' and operation = 'INSERT'
        and record_id in ('11111111-aaaa-4aaa-8aaa-111111111111', '22222222-bbbb-4bbb-8bbb-222222222222')) <> 2 then
    raise exception 'FAIL: task inserts were not audited';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_log'
      and column_name in ('old_values', 'new_values', 'record_snapshot')
  ) then
    raise exception 'FAIL: audit table defines copied record snapshots';
  end if;
  if not exists (
    select 1 from public.audit_log
    where entity_type = 'tasks' and record_id = '11111111-aaaa-4aaa-8aaa-111111111111'
      and changed_fields @> array['title', 'description']
  ) then
    raise exception 'FAIL: audit row does not list changed fields';
  end if;
  raise notice 'OK: audit rows capture operations and field names without duplicating content';
end $$;

select set_config('request.jwt.claims', '{"sub":"abababab-abab-4bab-8bab-abababababab","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.audit_log
      where entity_type = 'tasks'
        and record_id in ('11111111-aaaa-4aaa-8aaa-111111111111', '22222222-bbbb-4bbb-8bbb-222222222222')) <> 1 then
    raise exception 'FAIL: user A does not see only its own audit row';
  end if;
  begin
    insert into public.audit_log (user_id, entity_type, record_id, operation)
    values (auth.uid(), 'tasks', '33333333-cccc-4ccc-8ccc-333333333333', 'INSERT');
    raise exception 'FAIL: authenticated client can forge audit entries';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'OK: user A reads only its audit rows and cannot write audit entries';
end $$;

reset role;
select set_config('request.jwt.claims', '{"sub":"bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.audit_log
      where entity_type = 'tasks'
        and record_id in ('11111111-aaaa-4aaa-8aaa-111111111111', '22222222-bbbb-4bbb-8bbb-222222222222')) <> 1 then
    raise exception 'FAIL: user B can access another user audit row';
  end if;
  raise notice 'OK: user B sees only its audit rows';
end $$;

reset role;
-- Remove B's task while auth.users still contains B. The separate legacy
-- change_log trigger on tasks can then record its DELETE without an FK race.
delete from public.tasks where id = '22222222-bbbb-4bbb-8bbb-222222222222';
delete from auth.users where id = 'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc';
do $$
begin
  if exists (select 1 from public.audit_log where user_id = 'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc') then
    raise exception 'FAIL: deleting the account did not cascade to its audit entries';
  end if;
  if not exists (select 1 from public.audit_log where user_id = 'abababab-abab-4bab-8bab-abababababab') then
    raise exception 'FAIL: deleting user B removed user A audit entries';
  end if;
  raise notice 'OK: account deletion completes while dependent audit records are removed';
end $$;

select 'OK: phase 6 audit RLS tests passed' as resultado;
rollback;
