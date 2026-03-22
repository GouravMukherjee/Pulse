-- Pulse Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ═══════════════════════════════════════════════════════
-- 1. BUSINESSES (static config, seeded once)
-- ═══════════════════════════════════════════════════════
create table if not exists businesses (
  type text primary key,
  name text not null,
  tone text not null,
  voice_id text not null,
  voice_name text not null,
  discount_budget real not null,
  avg_transaction_value real not null,
  customer_lifetime_value real not null,
  email_signoff text not null,
  email_opening text not null,
  product_language text not null
);

-- ═══════════════════════════════════════════════════════
-- 2. PRODUCTS (catalog, seeded once)
-- ═══════════════════════════════════════════════════════
create table if not exists products (
  id text primary key,
  name text not null,
  price real not null,
  category text not null,
  launched text not null,
  margin real not null
);

-- ═══════════════════════════════════════════════════════
-- 3. COMPETITORS (static pricing data)
-- ═══════════════════════════════════════════════════════
create table if not exists competitors (
  name text primary key,
  our_price real not null,
  amazon real not null,
  target real not null,
  walmart real not null,
  delta real not null
);

-- ═══════════════════════════════════════════════════════
-- 4. CUSTOMERS
-- ═══════════════════════════════════════════════════════
create table if not exists customers (
  id text primary key,
  name text not null,
  email text not null,
  last_visit text not null,
  days_since_visit integer not null,
  top_items jsonb not null default '[]',
  churn_score integer not null,
  confidence_level text not null,
  pattern text not null,
  spend_trend text not null,
  avg_transaction_value real not null
);

-- ═══════════════════════════════════════════════════════
-- 5. TRANSACTIONS
-- ═══════════════════════════════════════════════════════
create table if not exists transactions (
  id bigint generated always as identity primary key,
  customer_id text not null references customers(id),
  date text not null,
  amount real not null
);

-- ═══════════════════════════════════════════════════════
-- 6. SURVEYS
-- ═══════════════════════════════════════════════════════
create table if not exists surveys (
  id bigint generated always as identity primary key,
  customer_id text not null,
  date text not null,
  satisfaction integer not null,
  would_recommend boolean not null,
  comments text not null,
  survey_influence real not null
);

-- ═══════════════════════════════════════════════════════
-- 7. BUSINESS PROFILE (user-editable, persisted)
-- ═══════════════════════════════════════════════════════
create table if not exists business_profiles (
  id text primary key default 'default',
  location text not null default '',
  description text not null default '',
  popular_products jsonb not null default '[]'
);

insert into business_profiles (id) values ('default') on conflict do nothing;

-- ═══════════════════════════════════════════════════════
-- 8. PRICE CACHE (market search results)
-- ═══════════════════════════════════════════════════════
create table if not exists price_cache (
  product text primary key,
  amazon real,
  target real,
  walmart real,
  delta real,
  citations jsonb not null default '[]',
  fetched_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════
-- 9. CUSTOMER STATUS (contacted/responded/retained)
-- ═══════════════════════════════════════════════════════
create table if not exists customer_status (
  customer_id text primary key references customers(id),
  contacted boolean not null default false,
  responded boolean not null default false,
  retained boolean not null default false,
  revenue_recovered real not null default 0,
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════
-- 10. YOUR PRICES (user-entered price comparisons)
-- ═══════════════════════════════════════════════════════
create table if not exists your_prices (
  product text primary key,
  price real not null,
  updated_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (open for anon — single-tenant demo)
-- ═══════════════════════════════════════════════════════
alter table businesses enable row level security;
alter table products enable row level security;
alter table competitors enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;
alter table surveys enable row level security;
alter table business_profiles enable row level security;
alter table price_cache enable row level security;
alter table customer_status enable row level security;
alter table your_prices enable row level security;

-- Allow all operations for anon (single-tenant demo app)
create policy "Allow all" on businesses for all using (true) with check (true);
create policy "Allow all" on products for all using (true) with check (true);
create policy "Allow all" on competitors for all using (true) with check (true);
create policy "Allow all" on customers for all using (true) with check (true);
create policy "Allow all" on transactions for all using (true) with check (true);
create policy "Allow all" on surveys for all using (true) with check (true);
create policy "Allow all" on business_profiles for all using (true) with check (true);
create policy "Allow all" on price_cache for all using (true) with check (true);
create policy "Allow all" on customer_status for all using (true) with check (true);
create policy "Allow all" on your_prices for all using (true) with check (true);
