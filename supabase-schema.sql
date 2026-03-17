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
