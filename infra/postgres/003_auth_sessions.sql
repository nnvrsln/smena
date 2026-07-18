begin;

create table auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index auth_sessions_active_user_idx
  on auth_sessions (user_id, expires_at)
  where revoked_at is null;

update users set password_hash = 'scrypt$62eb4e15a5c62643686623644f2085cb$aa34f3995f13b007a373e9124e1776368c84380e8e6f56d53be97ee2363ad4057cd03851a69e4a650de1c0ff1c7797e2d66db6adc74bb954470880b6166275c3'
where id = '20000000-0000-4000-8000-000000000001';

update users set password_hash = 'scrypt$ccf83dbde0aa9e326333be03422784d2$2ce35dee117896588e0e0b27949dfc729b2365168e3b578308d58040b6058abf030407c07add9a9ae9d428242c6a9bd43582ec4384ed8a6ae263e3d7c6c3b4d8'
where id = '20000000-0000-4000-8000-000000000002';

update users set password_hash = 'scrypt$326e0daddcefc400196058a78f3a22f7$980700c28d13c984d3bdb84144a7726d60485d85cb0f71fe8d0682212978d37fe6985054e9b12e929ea26b876ddb4b933214b3d76de7bdf2079b4b00e799a874'
where id = '20000000-0000-4000-8000-000000000003';

alter table users alter column password_hash set not null;

commit;
