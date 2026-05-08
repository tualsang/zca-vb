-- ─────────────────────────────────────────────────────────────────────
-- Volleyball Tournament — Supabase schema
-- Paste this into Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────

create table registrations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('team', 'free_agent')),
  church text not null,
  division text not null check (division in ('mens', 'womens')),
  captain_name text,
  player_name text,
  players jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security and set up public access policies
alter table registrations enable row level security;

create policy "Anyone can read registrations"
  on registrations for select
  using (true);

create policy "Anyone can insert registrations"
  on registrations for insert
  with check (true);

create policy "Anyone can delete registrations"
  on registrations for delete
  using (true);

-- ─────────────────────────────────────────────────────────────────────
-- Once you're ready to go live and want to lock down deletes,
-- run this from Supabase → SQL Editor:
--
--     drop policy "Anyone can delete registrations" on registrations;
--
-- After that, only YOU (via the Supabase Table Editor) can delete rows.
-- ─────────────────────────────────────────────────────────────────────
