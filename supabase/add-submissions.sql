-- ============================================================
-- Ehsas — User submissions + admin approval / rejection
-- ------------------------------------------------------------
-- Run this ONCE in the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
--
-- SAFETY / MIGRATION NOTES
--   * No existing table is dropped or rewritten.
--   * No existing row is modified or deleted.
--   * The `poems` table only gains two NEW, NULLABLE columns
--     (`pen_name`, `source_submission_id`). Existing poems get
--     NULL for both and keep behaving exactly as before.
--   * `poems` gets NO `status` column, so nothing that is
--     currently public can ever be hidden by this change.
--   * Approved user submissions are COPIED into `poems`, so they
--     flow through the existing feed with no query changes.
-- Safe to re-run (idempotent).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Admin registry + helper
-- ------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- is a given user an admin? (SECURITY DEFINER so it can read
-- `admins` from inside RLS policies without its own recursion)
create or replace function public.is_admin(check_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = check_user
  );
$$;

-- zero-arg variant for the current user (used from the client via rpc)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(auth.uid());
$$;

revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;

-- admins can see the admin list; NOBODY can write to it from the
-- client (membership is managed here in the SQL editor only).
drop policy if exists "Admins can view the admin list" on public.admins;
create policy "Admins can view the admin list" on public.admins
  for select using (public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- 2. Additive columns on `poems` (nullable, non-breaking)
-- ------------------------------------------------------------

alter table public.poems
  add column if not exists pen_name text;

alter table public.poems
  add column if not exists source_submission_id uuid;

-- ------------------------------------------------------------
-- 3. Submissions table
-- ------------------------------------------------------------

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  author_name text not null,
  category text not null default 'shayari'
    check (category in ('shayari', 'poem', 'quote', 'story', 'other')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_poem_id uuid references public.poems(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  approved_at timestamptz
);

create index if not exists submissions_status_created_idx
  on public.submissions (status, created_at desc);
create index if not exists submissions_user_created_idx
  on public.submissions (user_id, created_at desc);

alter table public.submissions enable row level security;

-- INSERT: a logged-in user may only create their own submission,
-- and only in the 'pending' state.
drop policy if exists "Users create their own pending submissions" on public.submissions;
create policy "Users create their own pending submissions" on public.submissions
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

-- SELECT: users see their own submissions; admins see everything.
-- Anonymous visitors see nothing (no `to public`/`anon` policy).
drop policy if exists "Users read own submissions, admins read all" on public.submissions;
create policy "Users read own submissions, admins read all" on public.submissions
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- DELETE: a user may withdraw their own submission while it is
-- still pending; admins may delete any submission.
drop policy if exists "Users delete their own pending submissions" on public.submissions;
create policy "Users delete their own pending submissions" on public.submissions
  for delete to authenticated
  using (auth.uid() = user_id and status = 'pending');

drop policy if exists "Admins delete any submission" on public.submissions;
create policy "Admins delete any submission" on public.submissions
  for delete to authenticated
  using (public.is_admin(auth.uid()));

-- UPDATE: ONLY admins, and never straight to 'approved' via the REST
-- API (approval must go through approve_submission() so the poem is
-- actually published). Regular users have no UPDATE policy at all, so
-- a normal user calling the REST API to flip `status` is denied.
drop policy if exists "Only admins update submissions" on public.submissions;
create policy "Only admins update submissions" on public.submissions
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()) and status <> 'approved');

-- ------------------------------------------------------------
-- 4. Approve / reject as SECURITY DEFINER functions
--    (approve must insert into `poems` on behalf of the original
--     author, which the admin could not do directly under RLS)
-- ------------------------------------------------------------

create or replace function public.approve_submission(
  p_id uuid,
  p_category text,
  p_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.submissions%rowtype;
  new_poem_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can approve submissions';
  end if;

  if p_category not in
    ('love','sad','joyful','nazm','dosti','ghazal','sher','kavita') then
    raise exception 'Invalid target category: %', p_category;
  end if;

  select * into s from public.submissions where id = p_id for update;
  if not found then
    raise exception 'Submission not found';
  end if;
  if s.status = 'approved' then
    raise exception 'Submission is already approved';
  end if;

  insert into public.poems
    (author_id, title, content, category, pen_name, source_submission_id)
  values (
    s.user_id,
    coalesce(nullif(btrim(p_title), ''), nullif(btrim(s.title), ''),
             left(regexp_replace(s.content, E'\\s+', ' ', 'g'), 60)),
    s.content,
    p_category,
    nullif(btrim(s.author_name), ''),
    s.id
  )
  returning id into new_poem_id;

  update public.submissions
     set status            = 'approved',
         reviewed_by       = auth.uid(),
         reviewed_at       = now(),
         approved_at       = now(),
         admin_note        = null,
         published_poem_id = new_poem_id
   where id = p_id;

  return new_poem_id;
end;
$$;

create or replace function public.reject_submission(
  p_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can reject submissions';
  end if;

  update public.submissions
     set status      = 'rejected',
         admin_note  = nullif(btrim(p_note), ''),
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_id and status <> 'approved';

  if not found then
    raise exception 'Submission not found or already approved';
  end if;
end;
$$;

revoke all on function public.approve_submission(uuid, text, text) from public, anon;
revoke all on function public.reject_submission(uuid, text) from public, anon;
grant execute on function public.approve_submission(uuid, text, text) to authenticated;
grant execute on function public.reject_submission(uuid, text) to authenticated;

-- ============================================================
-- 5. Make yourself an admin
-- ------------------------------------------------------------
-- First create your account through the normal sign-up form in
-- the app (or Dashboard -> Authentication -> Users -> Add user),
-- then run ONE of the following:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;
--
-- To remove an admin:
--   delete from public.admins
--   where user_id = (select id from auth.users where email = 'you@example.com');
-- ============================================================
