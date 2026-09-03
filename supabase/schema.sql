-- Koreer — database schema
--
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste →
-- Run. It is idempotent, so re-running it is safe.
--
-- Every table is owned by a user and protected by Row Level Security: a signed
-- in user can only ever see and modify their OWN rows. The publishable key that
-- ships in the browser cannot bypass these policies.

-- ── Career profile ──────────────────────────────────────────────────────────
-- One row per user. Mirrors lib/profile.ts.
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  headline    text not null default '',
  skills      text not null default '',
  education   text not null default '',
  experience  text not null default '',
  languages   text not null default '',
  strengths   text not null default '',
  -- "Why Korea" narrative (lib/whyKorea.ts)
  arrival_context      text not null default '',
  alternatives_weighed text not null default '',
  reason_to_stay       text not null default '',
  why_korea_draft      text not null default '',
  updated_at  timestamptz not null default now()
);

-- ── Documents (resumes and cover letters) ───────────────────────────────────
-- The builder state is stored as JSON so the document shape can evolve without
-- a migration for every field.
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('resume', 'cover_letter')),
  title       text not null default '',
  company     text not null default '',
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists documents_user_updated_idx
  on public.documents (user_id, updated_at desc);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.documents enable row level security;

-- profiles: a user may only touch their own row.
drop policy if exists "profiles are self-service" on public.profiles;
create policy "profiles are self-service"
  on public.profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- documents: a user may only touch their own documents.
drop policy if exists "documents are self-service" on public.documents;
create policy "documents are self-service"
  on public.documents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Keep updated_at honest ──────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at
  before update on public.documents
  for each row execute function public.touch_updated_at();
