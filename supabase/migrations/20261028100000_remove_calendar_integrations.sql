drop table if exists public.ical_calendar_feeds cascade;
drop table if exists public.event_google_mapping cascade;
drop table if exists public.calendar_sync_logs cascade;
drop table if exists public.google_calendar_oauth_states cascade;
drop table if exists public.google_calendar_credentials cascade;
drop table if exists public.google_calendar_integration cascade;

-- Keep events.ical_uid and its unique index for local .ics import/export deduplication.
