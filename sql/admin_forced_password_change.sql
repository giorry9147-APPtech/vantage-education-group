-- Run this in Supabase SQL Editor

alter table public.profiles
add column if not exists must_change_password boolean default false;

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
