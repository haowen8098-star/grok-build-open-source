create schema if not exists private;

create table if not exists public.grok_stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grok_stripe_credit_purchases (
  checkout_session_id text primary key,
  stripe_event_id text not null unique,
  payment_intent_id text unique,
  stripe_customer_id text,
  user_id uuid not null references auth.users(id) on delete restrict,
  pack_id text not null check (pack_id in ('builder', 'pro', 'studio')),
  amount_total integer not null check (amount_total > 0),
  currency text not null check (currency = lower(currency) and char_length(currency) = 3),
  credits numeric(14, 2) not null check (credits > 0),
  status text not null default 'paid' check (status in ('paid', 'refunded', 'disputed')),
  fulfilled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.grok_stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  checkout_session_id text,
  processed_at timestamptz not null default now()
);

create index if not exists grok_stripe_purchases_user_created_idx
  on public.grok_stripe_credit_purchases (user_id, created_at desc);
create index if not exists grok_stripe_events_session_idx
  on public.grok_stripe_webhook_events (checkout_session_id);

alter table public.grok_stripe_customers enable row level security;
alter table public.grok_stripe_credit_purchases enable row level security;
alter table public.grok_stripe_webhook_events enable row level security;

drop policy if exists "Users can read own Stripe customer" on public.grok_stripe_customers;
create policy "Users can read own Stripe customer"
  on public.grok_stripe_customers for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own Stripe purchases" on public.grok_stripe_credit_purchases;
create policy "Users can read own Stripe purchases"
  on public.grok_stripe_credit_purchases for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.grok_stripe_customers from anon, authenticated;
revoke all on public.grok_stripe_credit_purchases from anon, authenticated;
revoke all on public.grok_stripe_webhook_events from anon, authenticated;
grant select on public.grok_stripe_customers to authenticated;
grant select on public.grok_stripe_credit_purchases to authenticated;

alter table public.grok_credit_ledger
  drop constraint if exists grok_credit_ledger_kind_check;
alter table public.grok_credit_ledger
  add constraint grok_credit_ledger_kind_check
  check (kind in ('grant', 'purchase', 'reserve', 'settlement', 'refund', 'adjustment'));

create or replace function private.fulfill_stripe_credit_purchase(
  p_stripe_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_stripe_customer_id text,
  p_user_id uuid,
  p_pack_id text,
  p_amount_total integer,
  p_currency text,
  p_credits numeric
)
returns table (fulfilled boolean, balance numeric, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  account public.grok_credit_accounts%rowtype;
  inserted_events integer;
begin
  if p_livemode then
    raise exception 'Live Stripe events are disabled for this test integration';
  end if;

  if p_stripe_event_id is null or p_checkout_session_id is null or p_user_id is null then
    raise exception 'Missing Stripe fulfillment identity';
  end if;

  if p_pack_id not in ('builder', 'pro', 'studio') or p_amount_total <= 0 or p_credits <= 0 then
    raise exception 'Invalid Stripe fulfillment values';
  end if;

  insert into public.grok_stripe_webhook_events (
    stripe_event_id, event_type, livemode, checkout_session_id
  ) values (
    p_stripe_event_id, p_event_type, p_livemode, p_checkout_session_id
  )
  on conflict (stripe_event_id) do nothing;
  get diagnostics inserted_events = row_count;

  if inserted_events = 0 then
    select * into account from public.grok_credit_accounts where user_id = p_user_id;
    return query select false, coalesce(account.balance, 0), 'duplicate_event'::text;
    return;
  end if;

  if exists (
    select 1 from public.grok_stripe_credit_purchases
    where checkout_session_id = p_checkout_session_id
  ) then
    select * into account from public.grok_credit_accounts where user_id = p_user_id;
    return query select false, coalesce(account.balance, 0), 'duplicate_session'::text;
    return;
  end if;

  insert into public.grok_credit_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into account
  from public.grok_credit_accounts
  where user_id = p_user_id
  for update;

  update public.grok_credit_accounts
  set balance = balance + p_credits, updated_at = now()
  where user_id = p_user_id
  returning * into account;

  insert into public.grok_stripe_credit_purchases (
    checkout_session_id,
    stripe_event_id,
    payment_intent_id,
    stripe_customer_id,
    user_id,
    pack_id,
    amount_total,
    currency,
    credits
  ) values (
    p_checkout_session_id,
    p_stripe_event_id,
    nullif(p_payment_intent_id, ''),
    nullif(p_stripe_customer_id, ''),
    p_user_id,
    p_pack_id,
    p_amount_total,
    lower(p_currency),
    p_credits
  );

  insert into public.grok_credit_ledger (
    user_id, kind, amount, balance_after, description
  ) values (
    p_user_id,
    'purchase',
    p_credits,
    account.balance,
    'Stripe credit pack purchase: ' || p_pack_id
  );

  return query select true, account.balance, null::text;
end;
$$;

create or replace function public.fulfill_stripe_credit_purchase(
  p_stripe_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_stripe_customer_id text,
  p_user_id uuid,
  p_pack_id text,
  p_amount_total integer,
  p_currency text,
  p_credits numeric
)
returns table (fulfilled boolean, balance numeric, reason text)
language sql
security invoker
set search_path = ''
as $$
  select * from private.fulfill_stripe_credit_purchase(
    p_stripe_event_id,
    p_event_type,
    p_livemode,
    p_checkout_session_id,
    p_payment_intent_id,
    p_stripe_customer_id,
    p_user_id,
    p_pack_id,
    p_amount_total,
    p_currency,
    p_credits
  );
$$;

revoke all on function private.fulfill_stripe_credit_purchase(
  text, text, boolean, text, text, text, uuid, text, integer, text, numeric
) from public, anon, authenticated;
revoke all on function public.fulfill_stripe_credit_purchase(
  text, text, boolean, text, text, text, uuid, text, integer, text, numeric
) from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function private.fulfill_stripe_credit_purchase(
  text, text, boolean, text, text, text, uuid, text, integer, text, numeric
) to service_role;
grant execute on function public.fulfill_stripe_credit_purchase(
  text, text, boolean, text, text, text, uuid, text, integer, text, numeric
) to service_role;
