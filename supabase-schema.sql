-- Items table
create table items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'link', 'text')),
  title text not null default '',
  content text not null,
  tags text[] not null default '{}',
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index items_user_id_created_at on items(user_id, created_at desc);

-- Row Level Security
alter table items enable row level security;

create policy "Users can read own items"
  on items for select using (auth.uid() = user_id);

create policy "Users can insert own items"
  on items for insert with check (auth.uid() = user_id);

create policy "Users can update own items"
  on items for update using (auth.uid() = user_id);

create policy "Users can delete own items"
  on items for delete using (auth.uid() = user_id);

-- Subscriptions table
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  service_name text not null,
  account_email text,
  expiry_date date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_expiry on subscriptions(user_id, expiry_date);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_set_updated_at
before update on subscriptions
for each row execute function set_updated_at();

alter table subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on subscriptions for select using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
  on subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on subscriptions for update using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on subscriptions for delete using (auth.uid() = user_id);
