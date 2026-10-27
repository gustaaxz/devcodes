alter table public.events add column ical_uid text;
create unique index events_user_ical_uid_unique
  on public.events (user_id, ical_uid)
  where ical_uid is not null;

create table public.google_calendar_integration (
  user_id uuid primary key references auth.users (id) on delete cascade,
  selected_calendar_id text not null default 'primary',
  selected_calendar_summary text not null default 'Principal',
  selected_calendar_time_zone text not null default 'UTC',
  sync_enabled boolean not null default false,
  sync_token text,
  sync_locked_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.google_calendar_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token_ciphertext text not null,
  refresh_token_iv text not null,
  updated_at timestamptz not null default now()
);

create table public.google_calendar_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  code_verifier text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.calendar_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  direction text not null check (direction in ('to_google', 'from_google', 'bidirectional')),
  status text not null check (status in ('running', 'success', 'partial', 'error')),
  message text,
  imported_count integer not null default 0 check (imported_count >= 0),
  exported_count integer not null default 0 check (exported_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.ical_calendar_feeds (
  user_id uuid primary key references auth.users (id) on delete cascade,
  token_hash text not null unique,
  time_zone text not null default 'UTC',
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz
);

create table public.event_google_mapping (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Keep the UUID without an FK so a later sync can detect local deletions and delete the remote event.
  event_id uuid,
  calendar_id text not null,
  google_event_id text not null,
  google_etag text,
  local_updated_at timestamptz,
  google_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (user_id, calendar_id, google_event_id)
);

create unique index event_google_mapping_event_unique
  on public.event_google_mapping (user_id, calendar_id, event_id)
  where event_id is not null;
create index calendar_sync_logs_user_started_idx
  on public.calendar_sync_logs (user_id, started_at desc);
create index event_google_mapping_user_event_idx
  on public.event_google_mapping (user_id, event_id);

alter table public.google_calendar_integration enable row level security;
alter table public.google_calendar_credentials enable row level security;
alter table public.google_calendar_oauth_states enable row level security;
alter table public.calendar_sync_logs enable row level security;
alter table public.event_google_mapping enable row level security;
alter table public.ical_calendar_feeds enable row level security;

create policy google_calendar_integration_select_own on public.google_calendar_integration
  for select to authenticated using ((select auth.uid()) = user_id);
create policy calendar_sync_logs_select_own on public.calendar_sync_logs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy event_google_mapping_select_own on public.event_google_mapping
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.google_calendar_credentials from anon, authenticated;
revoke all on public.google_calendar_oauth_states from anon, authenticated;
revoke all on public.ical_calendar_feeds from anon, authenticated;
revoke all on public.google_calendar_integration from anon, authenticated;
revoke all on public.calendar_sync_logs from anon, authenticated;
revoke all on public.event_google_mapping from anon, authenticated;
grant select on public.google_calendar_integration, public.calendar_sync_logs, public.event_google_mapping to authenticated;
grant all on public.google_calendar_integration, public.google_calendar_credentials,
  public.google_calendar_oauth_states, public.calendar_sync_logs,
  public.event_google_mapping, public.ical_calendar_feeds to service_role;
