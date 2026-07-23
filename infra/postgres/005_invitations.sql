begin;

alter table users add column first_name text;
alter table users add column last_name text;
alter table users add column middle_name text;
alter table users add column specialization text;

create table invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  role membership_role not null check (role in ('foreman', 'worker')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references users(id),
  internal_note text,
  status text not null default 'active' check (status in ('active', 'used', 'revoked')),
  used_by uuid references users(id),
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create table invitation_objects (
  invitation_id uuid not null references invitations(id) on delete cascade,
  organization_id uuid not null,
  object_id uuid not null,
  primary key (invitation_id, object_id),
  foreign key (organization_id, object_id) references objects(organization_id, id)
);

create index invitations_organization_status_idx on invitations (organization_id, status, created_at desc);
create index invitations_token_status_idx on invitations (token_hash, status);

commit;
