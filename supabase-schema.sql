-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- If you already ran the previous version, run only the NEW TABLES section below

-- ── Babelcore Pro subscribers ───────────────────────────────────────────────
create table if not exists pro_users (
  user_id             text primary key,
  stripe_customer_id  text,
  stripe_session_id   text,
  is_active           boolean default true,
  created_at          timestamptz default now()
);
-- Run this line separately in the Supabase SQL editor:
-- ALTER TABLE pro_users ENABLE ROW LEVEL SECURITY;

-- ── User reports (from /communion and /bench) ────────────────────────────────
create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,
  category        text not null,
  description     text not null,
  reporter_id     text,
  msg_id          text,
  msg_text        text,
  msg_user_id     text,
  msg_user        text,
  attachment_url  text,
  status          text not null default 'open',
  created_at      timestamptz default now()
);
-- ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ── Channels table (C: dynamic channel creation) ───────────────────────────
create table if not exists channels (
  id         text primary key,
  name       text not null,
  pinned     boolean default false,
  created_at timestamptz default now()
);

-- Seed the five default channels (WHERE NOT EXISTS avoids duplicate-key errors)
insert into channels (id, name, pinned) select 'general',       'general',       false where not exists (select 1 from channels where id = 'general');
insert into channels (id, name, pinned) select 'goals',         'goals',         false where not exists (select 1 from channels where id = 'goals');
insert into channels (id, name, pinned) select 'research',      'research',      false where not exists (select 1 from channels where id = 'research');
insert into channels (id, name, pinned) select 'prayer',        'prayer',        false where not exists (select 1 from channels where id = 'prayer');
insert into channels (id, name, pinned) select 'announcements', 'announcements', true  where not exists (select 1 from channels where id = 'announcements');

-- ── Workspace users table (B: real user directory) ─────────────────────────
create table if not exists workspace_users (
  id         text primary key,
  name       text not null,
  initials   text not null,
  image_url  text,
  color      text not null default '#f97316',
  last_seen  timestamptz default now()
);

alter table channels        enable row level security;
alter table workspace_users enable row level security;

drop policy if exists "read channels"    on channels;
drop policy if exists "create channels"  on channels;
drop policy if exists "read users"       on workspace_users;
drop policy if exists "upsert own user"  on workspace_users;
drop policy if exists "update own user"  on workspace_users;
create policy "read channels"    on channels        for select using (true);
create policy "create channels"  on channels        for insert with check (true);
create policy "read users"       on workspace_users for select using (true);
create policy "upsert own user"  on workspace_users for insert with check (true);
create policy "update own user"  on workspace_users for update using (true);



create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  channel_id      text not null,
  user_id         text not null,
  user_name       text not null,
  user_initials   text not null,
  user_color      text not null default '#f97316',
  user_image_url  text,
  text            text not null,
  created_at      timestamptz default now()
);

create table if not exists reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid references messages(id) on delete cascade,
  user_id     text not null,
  emoji       text not null,
  unique (message_id, user_id, emoji)
);

alter table messages  enable row level security;
alter table reactions enable row level security;

drop policy if exists "read messages"    on messages;
drop policy if exists "write messages"   on messages;
drop policy if exists "read reactions"   on reactions;
drop policy if exists "add reactions"    on reactions;
drop policy if exists "remove reactions" on reactions;
create policy "read messages"    on messages  for select using (true);
create policy "write messages"   on messages  for insert with check (true);
create policy "read reactions"   on reactions for select using (true);
create policy "add reactions"    on reactions for insert with check (true);
create policy "remove reactions" on reactions for delete using (true);

-- ── Attachment columns on messages ────────────────────────
alter table messages add column if not exists attachment_url  text;
alter table messages add column if not exists attachment_name text;

-- ── Storage bucket for chat attachments ───────────────────
insert into storage.buckets (id, name, public)
  values ('chat-attachments', 'chat-attachments', true)
  on conflict (id) do nothing;

drop policy if exists "upload attachments" on storage.objects;
drop policy if exists "read attachments"   on storage.objects;
create policy "upload attachments" on storage.objects
  for insert with check (bucket_id = 'chat-attachments');
create policy "read attachments" on storage.objects
  for select using (bucket_id = 'chat-attachments');

-- ── Pin support ──────────────────────────────────────
alter table messages add column if not exists pinned boolean default false;

drop policy if exists "pin messages" on messages;
create policy "pin messages" on messages for update using (true) with check (true);

drop policy if exists "delete messages" on messages;
create policy "delete messages" on messages for delete using (true);
