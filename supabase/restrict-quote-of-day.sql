-- ============================================================
-- Ehsas — restrict "Quote of the Day" to admins only
-- ------------------------------------------------------------
-- Run this ONCE in the Supabase SQL Editor, AFTER
-- supabase/add-submissions.sql (it needs the public.is_admin()
-- helper created there).
--
-- SAFETY: only swaps RLS policies on `quote_of_day`. No table,
-- column, or row is changed. Reading the Quote of the Day stays
-- public exactly as before — only picking / changing / removing
-- it is now limited to admins.
-- ============================================================

-- Remove the old "any signed-in user" policies
drop policy if exists "Signed-in users can set the quote of the day" on public.quote_of_day;
drop policy if exists "Signed-in users can change the quote of the day" on public.quote_of_day;
drop policy if exists "Signed-in users can remove the quote of the day" on public.quote_of_day;

-- Public read stays as-is (recreate defensively, idempotent)
drop policy if exists "Quote of the day is viewable by everyone" on public.quote_of_day;
create policy "Quote of the day is viewable by everyone" on public.quote_of_day
  for select using (true);

-- Admin-only write
create policy "Admins can set the quote of the day" on public.quote_of_day
  for insert to authenticated
  with check (public.is_admin(auth.uid()));

create policy "Admins can change the quote of the day" on public.quote_of_day
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can remove the quote of the day" on public.quote_of_day
  for delete to authenticated
  using (public.is_admin(auth.uid()));
