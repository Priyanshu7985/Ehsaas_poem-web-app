# Ehsas — Shayari & Poetry Community

A community app for Shayari and poetry lovers. Anyone can read poems without an
account; writing, liking, commenting, and bookmarking require signing up.

## Features

- **Read without an account** — the feed, poet profiles, and audio poems are
  public.
- **Sign up / Log in** with email + password (via Supabase Auth) to write.
- **Publish poems**, like, comment, and bookmark favorites.
- **Quote of the Day** banner.
- **Audio poems** — upload and play recorded recitations.
- No mock data: the feed and audio section start empty and show a placeholder
  until real content exists.

## Tech stack

React + TypeScript + Vite, Tailwind CSS v4, React Router, and Supabase
(Postgres + Auth + Storage).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **Project Settings → API**, copy the **Project URL** and the
   **anon / public** API key.
3. In **Authentication → Providers**, make sure **Email** is enabled. For
   local development you can turn off "Confirm email" under
   **Authentication → Sign In / Providers → Email** so new accounts can log
   in immediately (otherwise users must click a confirmation link first).
4. In **Authentication → URL Configuration**:
   - **Site URL**: your production URL (e.g. `https://your-site.netlify.app`).
   - **Redirect URLs**: add every origin the app runs on, each with the
     reset-password path, so the "Forgot password?" email link works:
     ```
     http://localhost:5173/reset-password
     https://your-site.netlify.app/reset-password
     https://your-custom-domain.com/reset-password
     ```
     (The app always sends users back to `/reset-password` on whatever
     origin they requested the reset from — nothing is hard-coded.)

## 2. Set up the database

Open **SQL Editor** in your Supabase project, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and run it once. This creates:

- `profiles`, `poems`, `likes`, `comments`, `bookmarks`, `audio_poems`,
  `quotes` tables with Row Level Security
- a trigger that creates a `profiles` row automatically when someone signs up
- the public `audio-poems` storage bucket for recitations

No sample/demo data is inserted — everything starts empty by design. Add real
quotes later via the **Table Editor** (`quotes` table) if you want the "Quote
of the Day" banner populated.

### Submissions + admin approval

To enable the user-submission / admin-approval flow, also run
[`supabase/add-submissions.sql`](supabase/add-submissions.sql) once. It is
non-destructive — it adds an `admins` table, a `submissions` table, two new
**nullable** columns on `poems` (`pen_name`, `source_submission_id`), RLS
policies, and the `approve_submission` / `reject_submission` functions. No
existing row is touched, and `poems` gets **no** `status` column, so nothing
currently public can be hidden.

**Make yourself an admin:** create your account through the normal sign-up
form first, then in the SQL Editor run:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com'
on conflict do nothing;
```

Then open `/admin` while logged in with that account. Non-admins get an
"Access denied" screen, and the database rejects any approve/reject/status
change that doesn't come from an admin account.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values from step 1:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 4. Run the app

```bash
npm install
npm run dev
```

Open the printed local URL. You should be able to browse the feed as a guest;
sign up, then publish a poem to see it appear.

## Project structure

```
src/
  components/   Reusable UI (feed, cards, modals, comments, audio)
  context/      Auth state + the global sign-up/log-in modal
  lib/          Supabase client
  pages/        Route-level views (Home, Audio, Write, Profile, Bookmarks, Poet)
  types/        Shared TypeScript types
supabase/
  schema.sql    Full database schema, RLS policies, and storage bucket setup
```
