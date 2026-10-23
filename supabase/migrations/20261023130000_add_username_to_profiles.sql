-- Add username field and rename display_name to full_name in profiles table
alter table public.profiles
  rename column display_name to full_name;

alter table public.profiles
  add column if not exists username text unique;

-- Create index for faster lookups
create index if not exists profiles_username_idx on public.profiles (username);

-- Create function to resolve username or email to auth email
create or replace function public.get_auth_email(identifier text)
returns text as $$
declare
  v_email text;
  v_user_id uuid;
begin
  -- First, try to find by username (case-insensitive)
  if not identifier like '%@%' then
    select id into v_user_id from public.profiles where lower(username) = lower(identifier) limit 1;
    if v_user_id is not null then
      select email into v_email from auth.users where id = v_user_id limit 1;
      return v_email;
    end if;
  end if;
  
  -- Otherwise, try direct email lookup
  select email into v_email from auth.users where email = identifier limit 1;
  return v_email;
end;
$$ language plpgsql security definer set search_path = public, auth;

-- Update handle_new_user function to capture username and full_name from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''), lower(nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), '')));
  return new;
end;
$$ language plpgsql security definer set search_path = public;
