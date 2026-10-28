do $$
declare
  retired_table text;
begin
  foreach retired_table in array array[
    'ical_calendar_feeds',
    'event_google_mapping',
    'calendar_sync_logs',
    'google_calendar_oauth_states',
    'google_calendar_credentials',
    'google_calendar_integration'
  ] loop
    if to_regclass(format('public.%I', retired_table)) is not null then
      raise exception 'A tabela removida ainda existe: %', retired_table;
    end if;
  end loop;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events' and column_name = 'ical_uid'
  ) then
    raise exception 'A coluna events.ical_uid precisa permanecer para o intercâmbio local .ics.';
  end if;
end;
$$;

select 'OK: integrações externas removidas e suporte local .ics preservado' as resultado;
