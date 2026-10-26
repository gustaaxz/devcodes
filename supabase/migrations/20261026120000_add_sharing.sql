-- Migration: add sharing system for notes and events
-- Creates note_shares, event_shares, share_access_logs tables with RLS and RPCs

-- ============================================================
-- 1. note_shares
-- ============================================================
create table if not exists public.note_shares (
  id uuid default gen_random_uuid() primary key,
  note_id uuid not null references public.notes (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  share_token text unique not null default gen_random_uuid()::text,
  permission text not null default 'view' check (permission in ('view', 'edit')),
  shared_with_user_id uuid references auth.users (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.note_shares enable row level security;

create policy note_shares_owner on public.note_shares
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy note_shares_shared_with on public.note_shares
  for select to authenticated
  using ((select auth.uid()) = shared_with_user_id);

create policy note_shares_by_token on public.note_shares
  for select to anon, authenticated
  using (true);

create index if not exists note_shares_note_id_idx on public.note_shares (note_id);
create index if not exists note_shares_token_idx on public.note_shares (share_token);
create index if not exists note_shares_owner_id_idx on public.note_shares (owner_id);

-- ============================================================
-- 2. event_shares
-- ============================================================
create table if not exists public.event_shares (
  id uuid default gen_random_uuid() primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  share_token text unique not null default gen_random_uuid()::text,
  permission text not null default 'view' check (permission in ('view', 'edit')),
  shared_with_user_id uuid references auth.users (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.event_shares enable row level security;

create policy event_shares_owner on public.event_shares
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy event_shares_shared_with on public.event_shares
  for select to authenticated
  using ((select auth.uid()) = shared_with_user_id);

create policy event_shares_by_token on public.event_shares
  for select to anon, authenticated
  using (true);

create index if not exists event_shares_event_id_idx on public.event_shares (event_id);
create index if not exists event_shares_token_idx on public.event_shares (share_token);
create index if not exists event_shares_owner_id_idx on public.event_shares (owner_id);

-- ============================================================
-- 3. share_access_logs
-- ============================================================
create table if not exists public.share_access_logs (
  id uuid default gen_random_uuid() primary key,
  share_type text not null check (share_type in ('note', 'event')),
  share_id uuid not null,
  accessor_user_id uuid references auth.users (id) on delete set null,
  ip_address text,
  user_agent text,
  accessed_at timestamptz not null default now()
);

alter table public.share_access_logs enable row level security;

create policy share_access_logs_owner on public.share_access_logs
  for select to authenticated
  using (
    (share_type = 'note' and exists (
      select 1 from public.note_shares ns where ns.id = share_id and ns.owner_id = (select auth.uid())
    ))
    or
    (share_type = 'event' and exists (
      select 1 from public.event_shares es where es.id = share_id and es.owner_id = (select auth.uid())
    ))
  );

create policy share_access_logs_insert on public.share_access_logs
  for insert to anon, authenticated
  with check (true);

-- ============================================================
-- 4. Shared access policies on notes & events
-- ============================================================
create policy notes_select_shared on public.notes
  for select to authenticated
  using (exists (
    select 1 from public.note_shares ns
    where ns.note_id = notes.id
      and ns.shared_with_user_id = (select auth.uid())
      and (ns.expires_at is null or ns.expires_at > now())
  ));

create policy notes_update_shared on public.notes
  for update to authenticated
  using (exists (
    select 1 from public.note_shares ns
    where ns.note_id = notes.id
      and ns.shared_with_user_id = (select auth.uid())
      and ns.permission = 'edit'
      and (ns.expires_at is null or ns.expires_at > now())
  ));

create policy events_select_shared on public.events
  for select to authenticated
  using (exists (
    select 1 from public.event_shares es
    where es.event_id = events.id
      and es.shared_with_user_id = (select auth.uid())
      and (es.expires_at is null or es.expires_at > now())
  ));

create policy events_update_shared on public.events
  for update to authenticated
  using (exists (
    select 1 from public.event_shares es
    where es.event_id = events.id
      and es.shared_with_user_id = (select auth.uid())
      and es.permission = 'edit'
      and (es.expires_at is null or es.expires_at > now())
  ));

-- ============================================================
-- 5. Helper RPC: look up user id by email
-- ============================================================
create or replace function public.get_user_id_by_email(lookup_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_id uuid;
begin
  select id into found_id
  from auth.users
  where lower(email) = lower(lookup_email)
  limit 1;
  return found_id;
end;
$$;

revoke all on function public.get_user_id_by_email(text) from public, anon;
grant execute on function public.get_user_id_by_email(text) to authenticated;

-- ============================================================
-- 6. Helper RPCs for public share resolution with author profile
-- ============================================================
create or replace function public.get_shared_note(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_share record;
  v_note record;
  v_author record;
begin
  select * into v_share
  from public.note_shares
  where share_token = p_token
  limit 1;

  if not found then
    return null;
  end if;

  if v_share.expires_at is not null and v_share.expires_at < now() then
    return json_build_object('error', 'expired');
  end if;

  select * into v_note
  from public.notes
  where id = v_share.note_id;

  select email, raw_user_meta_data->>'full_name' as full_name into v_author
  from auth.users
  where id = v_share.owner_id;

  -- Log access
  insert into public.share_access_logs (share_type, share_id, accessor_user_id)
  values ('note', v_share.id, (select auth.uid()));

  return json_build_object(
    'note', json_build_object(
      'id', v_note.id,
      'title', v_note.title,
      'content', v_note.content,
      'created_at', v_note.created_at,
      'updated_at', v_note.updated_at
    ),
    'permission', v_share.permission,
    'expires_at', v_share.expires_at,
    'author', json_build_object(
      'name', coalesce(v_author.full_name, split_part(v_author.email, '@', 1)),
      'email', v_author.email
    )
  );
end;
$$;

revoke all on function public.get_shared_note(text) from public;
grant execute on function public.get_shared_note(text) to anon, authenticated;

create or replace function public.get_shared_event(p_token text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_share record;
  v_event record;
  v_author record;
begin
  select * into v_share
  from public.event_shares
  where share_token = p_token
  limit 1;

  if not found then
    return null;
  end if;

  if v_share.expires_at is not null and v_share.expires_at < now() then
    return json_build_object('error', 'expired');
  end if;

  select * into v_event
  from public.events
  where id = v_share.event_id;

  select email, raw_user_meta_data->>'full_name' as full_name into v_author
  from auth.users
  where id = v_share.owner_id;

  insert into public.share_access_logs (share_type, share_id, accessor_user_id)
  values ('event', v_share.id, (select auth.uid()));

  return json_build_object(
    'event', json_build_object(
      'id', v_event.id,
      'title', v_event.title,
      'description', v_event.description,
      'start_at', v_event.start_at,
      'end_at', v_event.end_at,
      'priority', v_event.priority,
      'status', v_event.status
    ),
    'permission', v_share.permission,
    'expires_at', v_share.expires_at,
    'author', json_build_object(
      'name', coalesce(v_author.full_name, split_part(v_author.email, '@', 1)),
      'email', v_author.email
    )
  );
end;
$$;

revoke all on function public.get_shared_event(text) from public;
grant execute on function public.get_shared_event(text) to anon, authenticated;
