drop function if exists public.fulfill_stripe_credit_purchase(
  text, text, boolean, text, text, text, uuid, text, integer, text, numeric
);
drop function if exists private.fulfill_stripe_credit_purchase(
  text, text, boolean, text, text, text, uuid, text, integer, text, numeric
);

drop table if exists public.grok_stripe_webhook_events;
drop table if exists public.grok_stripe_credit_purchases;
drop table if exists public.grok_stripe_customers;

alter table public.grok_credit_ledger
  drop constraint if exists grok_credit_ledger_kind_check;
alter table public.grok_credit_ledger
  add constraint grok_credit_ledger_kind_check
  check (kind in ('grant', 'reserve', 'settlement', 'refund', 'adjustment'));
