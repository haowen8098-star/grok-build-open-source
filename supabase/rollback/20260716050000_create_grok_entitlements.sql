drop trigger if exists on_auth_user_created_grok_account on auth.users;
drop function if exists public.handle_new_grok_user();
drop function if exists public.reserve_authenticated_grok_usage(uuid, uuid, text, numeric);
drop function if exists public.reserve_guest_grok_usage(text, text, uuid, text);
drop function if exists public.release_grok_usage(uuid, text);
drop function if exists public.settle_grok_usage(uuid, numeric, numeric, bigint, bigint, text);

drop table if exists public.grok_credit_ledger;
drop table if exists public.grok_usage_requests;
drop table if exists public.grok_guest_ip_allowances;
drop table if exists public.grok_guest_allowances;
drop table if exists public.grok_credit_accounts;
