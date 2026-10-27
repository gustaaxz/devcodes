begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'calendar-a@example.test', '{"full_name":"Calendar A","username":"calendar-a"}'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'calendar-b@example.test', '{"full_name":"Calendar B","username":"calendar-b"}');

insert into public.google_calendar_integration (user_id, selected_calendar_id)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'calendar-a'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'calendar-b');

insert into public.google_calendar_credentials (user_id, refresh_token_ciphertext, refresh_token_iv)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'encrypted-test-a', 'iv-a'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'encrypted-test-b', 'iv-b');

insert into public.google_calendar_oauth_states (state_hash, user_id, code_verifier, expires_at)
values
  ('test-state-a', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'test-verifier-a', now() + interval '5 minutes'),
  ('test-state-b', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'test-verifier-b', now() + interval '5 minutes');

insert into public.calendar_sync_logs (user_id, direction, status, message)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'bidirectional', 'success', 'fixture A'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'bidirectional', 'success', 'fixture B');

insert into public.ical_calendar_feeds (user_id, token_hash, time_zone)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'test-feed-hash-a', 'America/Sao_Paulo'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'test-feed-hash-b', 'UTC');

insert into public.event_google_mapping (user_id, event_id, calendar_id, google_event_id)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', 'calendar-a', 'google-a'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '22222222-2222-4222-8222-222222222222', 'calendar-b', 'google-b');

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'google_calendar_integration',
    'google_calendar_credentials',
    'google_calendar_oauth_states',
    'calendar_sync_logs',
    'event_google_mapping',
    'ical_calendar_feeds'
  ] loop
    if (select relrowsecurity from pg_class where oid = format('public.%I', v_table)::regclass) is distinct from true then
      raise exception 'FALHA: RLS não habilitado em %', v_table;
    end if;
  end loop;
  raise notice 'OK: RLS habilitado nas tabelas de integração Google';
end $$;

select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.google_calendar_integration) <> 1
    or (select count(*) from public.calendar_sync_logs) <> 1
    or (select count(*) from public.event_google_mapping) <> 1 then
    raise exception 'FALHA: usuário A não vê apenas os próprios dados de integração';
  end if;

  begin
    perform 1 from public.google_calendar_credentials;
    raise exception 'FALHA: usuário A leu credenciais de OAuth';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform 1 from public.google_calendar_oauth_states;
    raise exception 'FALHA: usuário A leu estados OAuth';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform 1 from public.ical_calendar_feeds;
    raise exception 'FALHA: usuário A acessou metadados privados do feed';
  exception when insufficient_privilege then
    null;
  end;

  raise notice 'OK: usuário A vê somente metadados próprios e não acessa tokens/estados OAuth';
end $$;

reset role;
select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.google_calendar_integration) <> 1
    or (select count(*) from public.calendar_sync_logs) <> 1
    or (select count(*) from public.event_google_mapping) <> 1 then
    raise exception 'FALHA: usuário B acessou metadados de integração de A';
  end if;
  raise notice 'OK: isolamento entre usuários';
end $$;

reset role;
select 'OK: testes RLS do Google Calendar passaram' as resultado;
rollback;
