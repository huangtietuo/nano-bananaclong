create table if not exists public.creem_subscription (
  id bigserial primary key,
  reference_id text,
  creem_customer_id text,
  creem_subscription_id text,
  creem_order_id text,
  product_id text,
  status text,
  period_start timestamptz,
  period_end timestamptz,
  cancel_at_period_end boolean,
  last_event_type text,
  last_event_id text,
  updated_at timestamptz not null default now()
);

create unique index if not exists creem_subscription_creem_subscription_id_unique
  on public.creem_subscription (creem_subscription_id)
  where creem_subscription_id is not null;

create unique index if not exists creem_subscription_creem_order_id_unique
  on public.creem_subscription (creem_order_id)
  where creem_order_id is not null;

alter table public.creem_subscription enable row level security;

create policy "creem_subscription_read_own"
  on public.creem_subscription
  for select
  to authenticated
  using (reference_id = auth.uid()::text);

