-- Run this in Supabase SQL Editor

alter table public.profiles
add column if not exists must_change_password boolean default false;

-- Force first-login password change for all current admin profiles.
update public.profiles
set must_change_password = true
where role = 'admin';

-- For each new admin you create manually in Supabase:
-- 1) Create auth user with a temporary password in Authentication > Users
-- 2) Ensure profile has role='admin' and must_change_password=true
--    Example:
--    update public.profiles
--    set role = 'admin', must_change_password = true
--    where id = '<auth_user_uuid>';

-- Optional hardening: allow authenticated users to update only their own
-- must_change_password flag. Run only if you use RLS on profiles and don't
-- already have an update policy for self-updates.
--
-- alter table public.profiles enable row level security;
--
-- drop policy if exists profiles_self_update_must_change_password on public.profiles;
-- create policy profiles_self_update_must_change_password
-- on public.profiles
-- for update
-- to authenticated
-- using (id = auth.uid())
-- with check (id = auth.uid());
