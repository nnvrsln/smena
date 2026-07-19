begin;
create extension if not exists pgcrypto;
create table if not exists object_qr_codes (
  object_id uuid primary key references objects(id),
  organization_id uuid not null,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  foreign key (organization_id, object_id) references objects(organization_id, id)
);
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null references users(id),
  object_id uuid not null,
  status text not null default 'open' check (status in ('open','closed')),
  started_at_device timestamptz not null,
  started_at_server timestamptz not null default now(),
  start_method text not null check (start_method in ('qr_scan','manual')),
  ended_at_device timestamptz,
  ended_at_server timestamptz,
  foreign key (organization_id, object_id) references objects(organization_id, id)
);
create unique index if not exists shifts_one_open_per_user on shifts(user_id) where status = 'open';
create table if not exists shift_events (
  id uuid primary key default gen_random_uuid(), shift_id uuid not null references shifts(id),
  organization_id uuid not null, user_id uuid not null, object_id uuid not null,
  event_type text not null check (event_type in ('shift_started','shift_ended')),
  method text not null check (method in ('qr_scan','manual')),
  occurred_at_device timestamptz not null, received_at_server timestamptz not null default now(),
  foreign key (organization_id, object_id) references objects(organization_id, id)
);
insert into object_qr_codes (object_id, organization_id, token_hash)
select o.id, o.organization_id, encode(digest('SMENA-QR-' || o.id::text, 'sha256'), 'hex')
from objects o where not exists (select 1 from object_qr_codes q where q.object_id = o.id);
commit;
