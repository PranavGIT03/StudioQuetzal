-- Run this once in your Supabase project: SQL Editor → New Query → Run

create table if not exists enquiries (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  phone       text        not null,
  company     text,
  service     text,
  details     text        not null,
  created_at  timestamptz not null    default now()
);

-- Lock down public access; only the service-role key (used by the API) can write
alter table enquiries enable row level security;

-- No RLS policies = no access for anon/authenticated roles.
-- The service-role key bypasses RLS, so the API server can still insert.
