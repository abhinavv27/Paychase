create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  plan text default 'free',
  created_at timestamptz default now()
);

create table organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) not null,
  user_id uuid references users(id) not null,
  role text not null default 'member',
  invited_by uuid references users(id),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  unique(organization_id, user_id)
);

alter table organizations enable row level security;
alter table organization_members enable row level security;

create policy "Users can view organizations they belong to"
  on organizations for select
  using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Users can create organizations"
  on organizations for insert
  with check (true);

create policy "Users can view their own memberships"
  on organization_members for select
  using (user_id = auth.uid());

create policy "Admins can manage members"
  on organization_members for insert
  with check (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = organization_members.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role = 'admin'
    )
  );

create policy "Admins can update members"
  on organization_members for update
  using (
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );
