-- Ehsas: Shayari & Poetry community app
-- Run this whole file once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.poems (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null default 'love' check (category in ('love', 'sad', 'joyful', 'nazm', 'dosti', 'ghazal', 'sher', 'kavita')),
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  poem_id uuid not null references public.poems(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poem_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  poem_id uuid not null references public.poems(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  poem_id uuid not null references public.poems(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poem_id, user_id)
);

create table if not exists public.audio_poems (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  audio_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  author text not null default 'Unknown',
  created_at timestamptz not null default now()
);

-- One published poem can be picked (by any signed-in user) as the
-- "Quote of the Day" for a given date. One row per date; picking a new
-- poem for a date that already has one replaces it.
create table if not exists public.quote_of_day (
  date date primary key,
  poem_id uuid not null references public.poems(id) on delete cascade,
  set_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Auto-create a profile row whenever someone signs up
-- (Sign-up form only collects email + password, so we derive a
-- starting username/display name from the email; users can edit
-- both later from their Profile page.)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  if base_username is null or base_username = '' then
    base_username := 'poet';
  end if;
  final_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, split_part(new.email, '@', 1));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.poems enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.bookmarks enable row level security;
alter table public.audio_poems enable row level security;
alter table public.quotes enable row level security;

-- Profiles: readable by anyone (needed to show author names publicly),
-- editable only by the owner.
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Poems: readable by anyone (guests can read without logging in).
-- Only authenticated users can create; only the author can edit/delete.
create policy "Poems are viewable by everyone" on public.poems
  for select using (true);
create policy "Authenticated users can publish poems" on public.poems
  for insert with check (auth.uid() = author_id);
create policy "Authors can update their own poems" on public.poems
  for update using (auth.uid() = author_id);
create policy "Authors can delete their own poems" on public.poems
  for delete using (auth.uid() = author_id);

-- Likes: readable by anyone (to show counts), only the owner can like/unlike.
create policy "Likes are viewable by everyone" on public.likes
  for select using (true);
create policy "Authenticated users can like poems" on public.likes
  for insert with check (auth.uid() = user_id);
create policy "Users can remove their own like" on public.likes
  for delete using (auth.uid() = user_id);

-- Comments: readable by anyone, only the owner can post/delete their own.
create policy "Comments are viewable by everyone" on public.comments
  for select using (true);
create policy "Authenticated users can comment" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);

-- Bookmarks: private to each user.
create policy "Users can view their own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);
create policy "Users can bookmark poems" on public.bookmarks
  for insert with check (auth.uid() = user_id);
create policy "Users can remove their own bookmark" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- Audio poems: readable by anyone, only the owner can upload/delete their own.
create policy "Audio poems are viewable by everyone" on public.audio_poems
  for select using (true);
create policy "Authenticated users can upload audio poems" on public.audio_poems
  for insert with check (auth.uid() = author_id);
create policy "Authors can delete their own audio poems" on public.audio_poems
  for delete using (auth.uid() = author_id);

-- Quotes: readable by anyone. Add your own via the Table Editor
-- (no seed/dummy data is inserted here on purpose).
create policy "Quotes are viewable by everyone" on public.quotes
  for select using (true);

-- Quote of the day: readable by anyone. Picking / changing / removing it is
-- restricted to admins — those policies live in the submissions section below
-- (they need the public.is_admin() helper, defined there).
alter table public.quote_of_day enable row level security;
create policy "Quote of the day is viewable by everyone" on public.quote_of_day
  for select using (true);

-- ============================================================
-- Storage bucket for recorded poetry recitations
-- ============================================================

insert into storage.buckets (id, name, public)
values ('audio-poems', 'audio-poems', true)
on conflict (id) do nothing;

create policy "Audio files are publicly readable"
  on storage.objects for select
  using (bucket_id = 'audio-poems');

create policy "Authenticated users can upload audio files"
  on storage.objects for insert
  with check (bucket_id = 'audio-poems' and auth.role() = 'authenticated');

create policy "Users can delete their own audio files"
  on storage.objects for delete
  using (bucket_id = 'audio-poems' and owner = auth.uid());

-- ============================================================
-- User submissions + admin approval / rejection
-- (see supabase/add-submissions.sql for the standalone migration
--  to apply this to an already-populated database)
-- ============================================================

alter table public.poems add column if not exists pen_name text;
alter table public.poems add column if not exists source_submission_id uuid;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin(check_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = check_user);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin(auth.uid());
$$;

grant execute on function public.is_admin(uuid) to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;

drop policy if exists "Admins can view the admin list" on public.admins;
create policy "Admins can view the admin list" on public.admins
  for select using (public.is_admin(auth.uid()));

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  author_name text not null,
  category text not null default 'love'
    check (category in (
      'love', 'sad', 'joyful', 'nazm', 'dosti', 'ghazal', 'sher', 'kavita',
      -- legacy values from an earlier version of the Write page, kept
      -- valid in case any submissions were already saved under them
      'shayari', 'poem', 'quote', 'story', 'other'
    )),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_poem_id uuid references public.poems(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  approved_at timestamptz
);

create index if not exists submissions_status_created_idx on public.submissions (status, created_at desc);
create index if not exists submissions_user_created_idx on public.submissions (user_id, created_at desc);

alter table public.submissions enable row level security;

drop policy if exists "Users create their own pending submissions" on public.submissions;
create policy "Users create their own pending submissions" on public.submissions
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Users read own submissions, admins read all" on public.submissions;
create policy "Users read own submissions, admins read all" on public.submissions
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users delete their own pending submissions" on public.submissions;
create policy "Users delete their own pending submissions" on public.submissions
  for delete to authenticated
  using (auth.uid() = user_id and status = 'pending');

drop policy if exists "Admins delete any submission" on public.submissions;
create policy "Admins delete any submission" on public.submissions
  for delete to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Only admins update submissions" on public.submissions;
create policy "Only admins update submissions" on public.submissions
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()) and status <> 'approved');

create or replace function public.approve_submission(p_id uuid, p_category text, p_title text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s public.submissions%rowtype;
  new_poem_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can approve submissions';
  end if;
  if p_category not in ('love','sad','joyful','nazm','dosti','ghazal','sher','kavita') then
    raise exception 'Invalid target category: %', p_category;
  end if;
  select * into s from public.submissions where id = p_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status = 'approved' then raise exception 'Submission is already approved'; end if;

  insert into public.poems (author_id, title, content, category, pen_name, source_submission_id)
  values (
    s.user_id,
    coalesce(nullif(btrim(p_title), ''), nullif(btrim(s.title), ''),
             left(regexp_replace(s.content, E'\\s+', ' ', 'g'), 60)),
    s.content, p_category, nullif(btrim(s.author_name), ''), s.id
  )
  returning id into new_poem_id;

  update public.submissions
     set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
         approved_at = now(), admin_note = null, published_poem_id = new_poem_id
   where id = p_id;
  return new_poem_id;
end;
$$;

create or replace function public.reject_submission(p_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only an admin can reject submissions';
  end if;
  update public.submissions
     set status = 'rejected', admin_note = nullif(btrim(p_note), ''),
         reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_id and status <> 'approved';
  if not found then raise exception 'Submission not found or already approved'; end if;
end;
$$;

revoke all on function public.approve_submission(uuid, text, text) from public, anon;
revoke all on function public.reject_submission(uuid, text) from public, anon;
grant execute on function public.approve_submission(uuid, text, text) to authenticated;
grant execute on function public.reject_submission(uuid, text) to authenticated;

-- Quote of the Day: admin-only write (public read policy is defined above).
drop policy if exists "Admins can set the quote of the day" on public.quote_of_day;
create policy "Admins can set the quote of the day" on public.quote_of_day
  for insert to authenticated with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can change the quote of the day" on public.quote_of_day;
create policy "Admins can change the quote of the day" on public.quote_of_day
  for update to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can remove the quote of the day" on public.quote_of_day;
create policy "Admins can remove the quote of the day" on public.quote_of_day
  for delete to authenticated using (public.is_admin(auth.uid()));
