begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'rls-a@example.test', '{"display_name":"Usuario A"}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'rls-b@example.test', '{"display_name":"Usuario B"}');

do $$
declare
  v_user uuid;
begin
  foreach v_user in array array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[] loop
    if (select count(*) from public.profiles where id = v_user) <> 1 then
      raise exception 'FALHA: perfil nao criado no cadastro';
    end if;
    if (select count(*) from public.programming_categories where user_id = v_user) <> 10 then
      raise exception 'FALHA: categorias de programacao padrao nao criadas';
    end if;
    if (select count(*) from public.categories where user_id = v_user) <> 6 then
      raise exception 'FALHA: categorias academicas padrao nao criadas';
    end if;
  end loop;
  raise notice 'OK: cadastro cria perfil e categorias padrao';
end $$;

select set_config('test.a_category', (select id::text from public.categories where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' limit 1), true);
select set_config('test.a_prog_category', (select id::text from public.programming_categories where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and slug = 'javascript'), true);
select set_config('test.b_prog_category', (select id::text from public.programming_categories where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and slug = 'javascript'), true);

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);
set local role authenticated;

insert into public.notes (title, content) values ('Nota A', 'conteudo A');
insert into public.tasks (title) values ('Tarefa A');
insert into public.events (title, start_at) values ('Evento A', now());
insert into public.tags (name) values ('tag-a');
insert into public.stored_files (category_id, original_name, storage_key, extension, mime_type, size_bytes)
values (
  current_setting('test.a_prog_category')::uuid,
  'a.js',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/11111111-1111-1111-1111-111111111111/a.js',
  'js',
  'text/javascript',
  10
);
insert into storage.objects (bucket_id, name, owner)
values (
  'programming-files',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/11111111-1111-1111-1111-111111111111/a.js',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

do $$
begin
  if (select count(*) from public.notes) <> 1
    or (select count(*) from public.tasks) <> 1
    or (select count(*) from public.events) <> 1
    or (select count(*) from public.tags) <> 1
    or (select count(*) from public.stored_files) <> 1
    or (select count(*) from storage.objects) <> 1
    or (select count(*) from public.programming_categories) <> 10
    or (select count(*) from public.profiles) <> 1 then
    raise exception 'FALHA: usuario A nao enxerga exatamente os proprios registros';
  end if;
  raise notice 'OK: usuario A le apenas os proprios registros';
end $$;

do $$
declare
  v_state text;
begin
  begin
    delete from public.programming_categories where id = current_setting('test.a_prog_category')::uuid;
    raise exception 'FALHA: categoria com arquivos foi excluida';
  exception when foreign_key_violation then
    null;
  end;

  begin
    update public.stored_files set category_id = current_setting('test.b_prog_category')::uuid;
    raise exception 'FALHA: arquivo movido para categoria de outro usuario';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.events (title, start_at, end_at) values ('Invalido', now(), now() - interval '1 hour');
    raise exception 'FALHA: evento com termino anterior ao inicio aceito';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.tasks (title, priority) values ('Invalida', 'urgente');
    raise exception 'FALHA: prioridade invalida aceita';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.programming_categories (name, slug) values ('Ruim', 'Slug Invalido');
    raise exception 'FALHA: slug invalido aceito';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.notes (title) values (repeat('x', 201));
    raise exception 'FALHA: titulo de nota acima do limite aceito';
  exception when check_violation then
    null;
  end;

  raise notice 'OK: restricoes de integridade do usuario A';
end $$;

reset role;

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
  v_count integer;
  v_own_note uuid;
begin
  if (select count(*) from public.notes) <> 0
    or (select count(*) from public.tasks) <> 0
    or (select count(*) from public.events) <> 0
    or (select count(*) from public.tags) <> 0
    or (select count(*) from public.stored_files) <> 0
    or (select count(*) from storage.objects) <> 0 then
    raise exception 'FALHA: usuario B enxerga registros do usuario A';
  end if;
  if (select count(*) from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0
    or (select count(*) from public.categories where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0
    or (select count(*) from public.programming_categories where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') <> 0 then
    raise exception 'FALHA: usuario B enxerga perfil ou categorias do usuario A';
  end if;
  raise notice 'OK: usuario B nao enxerga nada do usuario A';

  update public.notes set title = 'invadida';
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B atualizou nota de A'; end if;
  delete from public.notes;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B excluiu nota de A'; end if;
  update public.tasks set title = 'invadida';
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B atualizou tarefa de A'; end if;
  delete from public.events;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B excluiu evento de A'; end if;
  update public.stored_files set original_name = 'invadido.js';
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B atualizou arquivo de A'; end if;
  delete from public.stored_files;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B excluiu arquivo de A'; end if;
  delete from public.programming_categories;
  get diagnostics v_count = row_count;
  if v_count <> 10 then raise exception 'FALHA: B deveria excluir apenas as proprias categorias vazias'; end if;
  raise notice 'OK: usuario B nao altera nem exclui registros do usuario A';
end $$;

do $$
declare
  v_note uuid;
begin
  begin
    insert into public.notes (user_id, title) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'invasao');
    raise exception 'FALHA: B criou nota em nome de A';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.tasks (title, category_id) values ('x', current_setting('test.a_category')::uuid);
    raise exception 'FALHA: B usou categoria de A em tarefa';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.stored_files (category_id, original_name, storage_key, extension, mime_type, size_bytes)
    values (current_setting('test.a_prog_category')::uuid, 'b.js', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/x/b.js', 'js', 'text/javascript', 1);
    raise exception 'FALHA: B enviou arquivo para categoria de A';
  exception when insufficient_privilege then
    null;
  end;

  insert into public.notes (title) values ('Nota B') returning id into v_note;
  begin
    insert into public.note_tags (note_id, tag_id)
    select v_note, id from (select id from public.tags limit 1) t;
    raise notice 'AVISO: B nao enxerga tags de A (esperado nenhuma linha inserida)';
  end;
  if (select count(*) from public.note_tags where note_id = v_note) <> 0 then
    raise exception 'FALHA: B vinculou tag de A';
  end if;

  raise notice 'OK: B nao cria registros em nome de A nem usa categorias e tags de A';
end $$;

do $$
declare
  v_count integer;
begin
  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('programming-files', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/hack/x.js', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    raise exception 'FALHA: B gravou na pasta de A no Storage';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into storage.objects (bucket_id, name, owner)
    values ('outro-bucket', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/x/y.js', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    raise exception 'FALHA: B gravou em bucket sem politica';
  exception when insufficient_privilege or foreign_key_violation then
    null;
  end;

  insert into storage.objects (bucket_id, name, owner)
  values ('programming-files', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/22222222-2222-2222-2222-222222222222/b.js', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

  update storage.objects set name = name || '.x' where name like 'aaaaaaaa%';
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B alterou objeto de A'; end if;

  delete from storage.objects where name like 'aaaaaaaa%';
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'FALHA: B excluiu objeto de A'; end if;

  if (select count(*) from storage.objects) <> 1 then
    raise exception 'FALHA: B deveria enxergar apenas o proprio objeto';
  end if;

  raise notice 'OK: politicas de Storage isolam as pastas por usuario';
end $$;

reset role;

select set_config('request.jwt.claims', '', true);
set local role anon;

do $$
begin
  if (select count(*) from public.notes) <> 0
    or (select count(*) from public.tasks) <> 0
    or (select count(*) from public.events) <> 0
    or (select count(*) from public.stored_files) <> 0
    or (select count(*) from public.profiles) <> 0
    or (select count(*) from public.programming_categories) <> 0
    or (select count(*) from storage.objects) <> 0 then
    raise exception 'FALHA: usuario anonimo enxerga dados';
  end if;

  begin
    insert into public.notes (title) values ('anonima');
    raise exception 'FALHA: usuario anonimo criou nota';
  exception when insufficient_privilege or not_null_violation then
    null;
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('programming-files', 'x/y/z.js');
    raise exception 'FALHA: usuario anonimo gravou no Storage';
  exception when insufficient_privilege then
    null;
  end;

  raise notice 'OK: usuario anonimo nao le nem grava dados';
end $$;

reset role;

select 'OK: todos os testes de isolamento passaram' as resultado;

rollback;
