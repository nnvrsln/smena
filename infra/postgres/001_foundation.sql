begin;

create extension if not exists pgcrypto;

create type membership_role as enum ('contractor', 'foreman', 'worker');

create table users (
  id uuid primary key default gen_random_uuid(),
  phone_normalized text not null unique,
  display_name text not null,
  password_hash text,
  status text not null default 'active' check (status in ('invited', 'active', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  user_id uuid not null references users(id),
  role membership_role not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  code text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique (organization_id, code),
  unique (organization_id, id)
);

create table object_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  object_id uuid not null,
  user_id uuid not null references users(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  foreign key (organization_id, object_id) references objects(organization_id, id),
  unique (object_id, user_id)
);

create table object_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  object_id uuid not null,
  summary_date date not null default current_date,
  planned_workers integer not null default 0 check (planned_workers >= 0),
  present_workers integer not null default 0 check (present_workers >= 0),
  day_progress integer not null default 0 check (day_progress between 0 and 100),
  issue_count integer not null default 0 check (issue_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, object_id) references objects(organization_id, id),
  unique (object_id, summary_date)
);

create index memberships_user_scope_idx on memberships (user_id, organization_id, status);
create index objects_organization_status_idx on objects (organization_id, status);
create index object_memberships_user_scope_idx on object_memberships (user_id, organization_id, status);
create index object_daily_summaries_scope_idx on object_daily_summaries (organization_id, summary_date, object_id);

commit;
