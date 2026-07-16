create extension if not exists pgcrypto;

create table if not exists public.grok_credit_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(14, 2) not null default 0 check (balance >= 0),
  free_questions_used smallint not null default 0 check (free_questions_used between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grok_guest_allowances (
  guest_hash text primary key,
  free_questions_used smallint not null default 0 check (free_questions_used between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grok_guest_ip_allowances (
  ip_hash text primary key,
  free_questions_used smallint not null default 0 check (free_questions_used between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grok_usage_requests (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete set null,
  guest_hash text,
  ip_hash text,
  model text not null,
  mode text not null check (mode in ('free', 'credits')),
  status text not null default 'reserved' check (status in ('reserved', 'settled', 'released')),
  reserved_credits numeric(14, 2) not null default 0 check (reserved_credits >= 0),
  actual_credits numeric(14, 2),
  provider_cost_usd numeric(18, 8),
  prompt_tokens bigint,
  completion_tokens bigint,
  generation_id text,
  error_message text,
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  check (
    (user_id is not null and guest_hash is null and ip_hash is null)
    or (user_id is null and guest_hash is not null and ip_hash is not null)
  )
);

create table if not exists public.grok_credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.grok_usage_requests(id) on delete set null,
  kind text not null check (kind in ('grant', 'reserve', 'settlement', 'refund', 'adjustment')),
  amount numeric(14, 2) not null,
  balance_after numeric(14, 2) not null check (balance_after >= 0),
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists grok_credit_ledger_user_created_idx
  on public.grok_credit_ledger (user_id, created_at desc);
create index if not exists grok_usage_requests_user_created_idx
  on public.grok_usage_requests (user_id, created_at desc);

alter table public.grok_credit_accounts enable row level security;
alter table public.grok_guest_allowances enable row level security;
alter table public.grok_guest_ip_allowances enable row level security;
alter table public.grok_usage_requests enable row level security;
alter table public.grok_credit_ledger enable row level security;

drop policy if exists "Users can read own Grok credit account" on public.grok_credit_accounts;
create policy "Users can read own Grok credit account"
  on public.grok_credit_accounts for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own Grok credit ledger" on public.grok_credit_ledger;
create policy "Users can read own Grok credit ledger"
  on public.grok_credit_ledger for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.grok_guest_allowances from anon, authenticated;
revoke all on public.grok_guest_ip_allowances from anon, authenticated;
revoke all on public.grok_usage_requests from anon, authenticated;
revoke insert, update, delete on public.grok_credit_accounts from anon, authenticated;
revoke insert, update, delete on public.grok_credit_ledger from anon, authenticated;
grant select on public.grok_credit_accounts to authenticated;
grant select on public.grok_credit_ledger to authenticated;

create or replace function public.handle_new_grok_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.grok_credit_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_grok_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_grok_account on auth.users;
create trigger on_auth_user_created_grok_account
  after insert on auth.users
  for each row execute procedure public.handle_new_grok_user();

create or replace function public.reserve_authenticated_grok_usage(
  p_user_id uuid,
  p_request_id uuid,
  p_model text,
  p_reserved_credits numeric
)
returns table (allowed boolean, usage_mode text, balance numeric, free_remaining integer, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  account public.grok_credit_accounts%rowtype;
  existing public.grok_usage_requests%rowtype;
begin
  select * into existing from public.grok_usage_requests where id = p_request_id;
  if found then
    select * into account from public.grok_credit_accounts where user_id = p_user_id;
    return query select true, existing.mode, account.balance,
      greatest(0, 3 - account.free_questions_used)::integer, 'idempotent';
    return;
  end if;

  insert into public.grok_credit_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into account
  from public.grok_credit_accounts
  where user_id = p_user_id
  for update;

  if account.free_questions_used < 3 and p_model = 'x-ai/grok-build-0.1' then
    update public.grok_credit_accounts
    set free_questions_used = free_questions_used + 1, updated_at = now()
    where user_id = p_user_id
    returning * into account;

    insert into public.grok_usage_requests (id, user_id, model, mode)
    values (p_request_id, p_user_id, p_model, 'free');

    return query select true, 'free'::text, account.balance,
      greatest(0, 3 - account.free_questions_used)::integer, null::text;
    return;
  end if;

  if p_reserved_credits <= 0 or account.balance < p_reserved_credits then
    return query select false, 'credits'::text, account.balance, 0,
      'insufficient_credits'::text;
    return;
  end if;

  update public.grok_credit_accounts
  set balance = balance - p_reserved_credits, updated_at = now()
  where user_id = p_user_id
  returning * into account;

  insert into public.grok_usage_requests (
    id, user_id, model, mode, reserved_credits
  ) values (
    p_request_id, p_user_id, p_model, 'credits', p_reserved_credits
  );

  insert into public.grok_credit_ledger (
    user_id, request_id, kind, amount, balance_after, description
  ) values (
    p_user_id, p_request_id, 'reserve', -p_reserved_credits,
    account.balance, 'AI usage hold'
  );

  return query select true, 'credits'::text, account.balance, 0, null::text;
end;
$$;

create or replace function public.reserve_guest_grok_usage(
  p_guest_hash text,
  p_ip_hash text,
  p_request_id uuid,
  p_model text
)
returns table (allowed boolean, free_remaining integer, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  guest_used smallint;
  ip_used smallint;
begin
  if p_model <> 'x-ai/grok-build-0.1' then
    return query select false, 0, 'advanced_model_requires_credits'::text;
    return;
  end if;

  if exists(select 1 from public.grok_usage_requests where id = p_request_id) then
    select free_questions_used into guest_used
    from public.grok_guest_allowances where guest_hash = p_guest_hash;
    return query select true, greatest(0, 3 - coalesce(guest_used, 0))::integer,
      'idempotent'::text;
    return;
  end if;

  insert into public.grok_guest_allowances (guest_hash)
  values (p_guest_hash)
  on conflict (guest_hash) do nothing;
  insert into public.grok_guest_ip_allowances (ip_hash)
  values (p_ip_hash)
  on conflict (ip_hash) do nothing;

  select free_questions_used into guest_used
  from public.grok_guest_allowances
  where guest_hash = p_guest_hash
  for update;
  select free_questions_used into ip_used
  from public.grok_guest_ip_allowances
  where ip_hash = p_ip_hash
  for update;

  if guest_used >= 3 or ip_used >= 3 then
    return query select false,
      greatest(0, 3 - greatest(guest_used, ip_used))::integer,
      'guest_limit_reached'::text;
    return;
  end if;

  update public.grok_guest_allowances
  set free_questions_used = free_questions_used + 1, updated_at = now()
  where guest_hash = p_guest_hash
  returning free_questions_used into guest_used;
  update public.grok_guest_ip_allowances
  set free_questions_used = free_questions_used + 1, updated_at = now()
  where ip_hash = p_ip_hash;

  insert into public.grok_usage_requests (
    id, guest_hash, ip_hash, model, mode
  ) values (
    p_request_id, p_guest_hash, p_ip_hash, p_model, 'free'
  );

  return query select true, greatest(0, 3 - guest_used)::integer, null::text;
end;
$$;

create or replace function public.release_grok_usage(
  p_request_id uuid,
  p_error_message text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  usage public.grok_usage_requests%rowtype;
  new_balance numeric;
begin
  select * into usage
  from public.grok_usage_requests
  where id = p_request_id
  for update;

  if not found or usage.status <> 'reserved' then return; end if;

  if usage.mode = 'credits' and usage.user_id is not null then
    update public.grok_credit_accounts
    set balance = balance + usage.reserved_credits, updated_at = now()
    where user_id = usage.user_id
    returning balance into new_balance;

    insert into public.grok_credit_ledger (
      user_id, request_id, kind, amount, balance_after, description
    ) values (
      usage.user_id, usage.id, 'refund', usage.reserved_credits,
      new_balance, 'Released AI usage hold'
    );
  elsif usage.user_id is not null then
    update public.grok_credit_accounts
    set free_questions_used = greatest(0, free_questions_used - 1), updated_at = now()
    where user_id = usage.user_id;
  else
    update public.grok_guest_allowances
    set free_questions_used = greatest(0, free_questions_used - 1), updated_at = now()
    where guest_hash = usage.guest_hash;
    update public.grok_guest_ip_allowances
    set free_questions_used = greatest(0, free_questions_used - 1), updated_at = now()
    where ip_hash = usage.ip_hash;
  end if;

  update public.grok_usage_requests
  set status = 'released', error_message = left(p_error_message, 500), settled_at = now()
  where id = p_request_id;
end;
$$;

create or replace function public.settle_grok_usage(
  p_request_id uuid,
  p_actual_credits numeric,
  p_provider_cost_usd numeric,
  p_prompt_tokens bigint,
  p_completion_tokens bigint,
  p_generation_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  usage public.grok_usage_requests%rowtype;
  account public.grok_credit_accounts%rowtype;
  charge numeric;
  adjustment numeric;
begin
  select * into usage
  from public.grok_usage_requests
  where id = p_request_id
  for update;

  if not found or usage.status <> 'reserved' then return; end if;

  charge := greatest(0, round(coalesce(p_actual_credits, 0), 2));

  if usage.mode = 'credits' and usage.user_id is not null then
    select * into account
    from public.grok_credit_accounts
    where user_id = usage.user_id
    for update;

    charge := least(charge, usage.reserved_credits + account.balance);
    adjustment := usage.reserved_credits - charge;

    if adjustment <> 0 then
      update public.grok_credit_accounts
      set balance = balance + adjustment, updated_at = now()
      where user_id = usage.user_id
      returning * into account;

      insert into public.grok_credit_ledger (
        user_id, request_id, kind, amount, balance_after, description
      ) values (
        usage.user_id, usage.id, 'settlement', adjustment,
        account.balance, 'Settled AI usage to actual provider cost'
      );
    end if;
  end if;

  update public.grok_usage_requests
  set status = 'settled', actual_credits = charge,
      provider_cost_usd = p_provider_cost_usd,
      prompt_tokens = p_prompt_tokens,
      completion_tokens = p_completion_tokens,
      generation_id = left(p_generation_id, 200),
      settled_at = now()
  where id = p_request_id;
end;
$$;

revoke all on function public.reserve_authenticated_grok_usage(uuid, uuid, text, numeric) from public, anon, authenticated;
revoke all on function public.reserve_guest_grok_usage(text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.release_grok_usage(uuid, text) from public, anon, authenticated;
revoke all on function public.settle_grok_usage(uuid, numeric, numeric, bigint, bigint, text) from public, anon, authenticated;

grant execute on function public.reserve_authenticated_grok_usage(uuid, uuid, text, numeric) to service_role;
grant execute on function public.reserve_guest_grok_usage(text, text, uuid, text) to service_role;
grant execute on function public.release_grok_usage(uuid, text) to service_role;
grant execute on function public.settle_grok_usage(uuid, numeric, numeric, bigint, bigint, text) to service_role;
