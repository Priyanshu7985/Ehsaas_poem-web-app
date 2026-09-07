-- Run this once in the Supabase SQL Editor to fix the
-- "violates foreign key constraint poems_author_id_fkey" error.

-- 1) Allow a logged-in user to create their own profile row
--    (needed as a safety net if the signup trigger ever misses).
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 2) Backfill a profile for any existing auth user that is missing one.
insert into public.profiles (id, username, display_name)
select
  u.id,
  lower(regexp_replace(split_part(u.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'))
    || '_' || substr(replace(u.id::text, '-', ''), 1, 6),
  split_part(u.email, '@', 1)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
