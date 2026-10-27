-- Migration: add task reminders and reminder preferences
-- Tables: task_reminders, reminder_preferences with RLS

-- ============================================================
-- 1. reminder_preferences
-- ============================================================
create table if not exists public.reminder_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  default_offset_minutes integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reminder_preferences enable row level security;

create policy reminder_preferences_select_own on public.reminder_preferences
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy reminder_preferences_insert_own on public.reminder_preferences
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy reminder_preferences_update_own on public.reminder_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 2. task_reminders
-- ============================================================
create table if not exists public.task_reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  remind_at timestamptz not null,
  offset_minutes integer not null default 15,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'both')),
  status text not null default 'pending' check (status in ('pending', 'notified', 'dismissed', 'snoozed')),
  created_at timestamptz not null default now()
);

alter table public.task_reminders enable row level security;

create policy task_reminders_select_own on public.task_reminders
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy task_reminders_insert_own on public.task_reminders
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.tasks
      where tasks.id = task_reminders.task_id and tasks.user_id = (select auth.uid())
    )
  );

create policy task_reminders_update_own on public.task_reminders
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.tasks
      where tasks.id = task_reminders.task_id and tasks.user_id = (select auth.uid())
    )
  );

create policy task_reminders_delete_own on public.task_reminders
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists task_reminders_user_id_idx on public.task_reminders (user_id);
create index if not exists task_reminders_task_id_idx on public.task_reminders (task_id);
create index if not exists task_reminders_remind_at_idx on public.task_reminders (remind_at);
create index if not exists task_reminders_status_idx on public.task_reminders (status);

-- A task has at most one active reminder. This also makes edits idempotent.
create unique index if not exists task_reminders_task_id_unique_idx
  on public.task_reminders (task_id);
create index if not exists task_reminders_due_lookup_idx
  on public.task_reminders (user_id, status, channel, remind_at);

grant select, insert, update, delete on public.task_reminders to authenticated;
grant select, insert, update on public.reminder_preferences to authenticated;

create or replace function public.sync_task_reminder_with_task()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' or new.due_at is null then
    delete from public.task_reminders
    where task_id = new.id and user_id = new.user_id;
  elsif old.due_at is distinct from new.due_at then
    update public.task_reminders
    set remind_at = new.due_at - make_interval(mins => offset_minutes),
        status = 'pending'
    where task_id = new.id and user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_task_reminder_with_task on public.tasks;
create trigger sync_task_reminder_with_task
  after update of due_at, status on public.tasks
  for each row execute function public.sync_task_reminder_with_task();
