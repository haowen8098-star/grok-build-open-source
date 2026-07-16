# Grok Building

An independent, source-backed guide to Grok Build open source, plus a live xAI model playground powered through OpenRouter.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4
- Supabase Auth and Postgres for email accounts, guest allowances, credit balances, reservations, settlements, and refunds
- `@supabase/ssr` for cookie sessions and `@supabase/server` for verified server contexts
- OpenRouter for the live xAI model catalog and streamed chat completions
- Stripe-hosted Checkout in test mode for one-time credit packs

## Local development

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill every required value.
3. Apply `supabase/migrations/20260716050000_create_grok_entitlements.sql`, then `supabase/migrations/20260716054334_create_stripe_credit_payments.sql`, to the dedicated Supabase project.
4. In Supabase Auth URL Configuration, set the production Site URL to `https://www.grokbuilding.com` and allow `https://www.grokbuilding.com/auth/callback` plus `http://localhost:3001/auth/callback` for local testing.
5. Keep email/password enabled, require email confirmation, and leave Google disabled until its provider credentials and consent screen are ready.
6. Run `pnpm dev` and open `http://localhost:3001`.

Never expose `SUPABASE_SECRET_KEY`, `GUEST_SESSION_SECRET`, `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` in browser code or commit them to Git.

## Runtime behavior

- Guests receive three completed questions on `x-ai/grok-build-0.1`. A signed, HttpOnly guest cookie and hashed network identifier protect the allowance from simple browser-storage resets.
- Failed or interrupted provider calls release the reserved free question or credit hold.
- Email accounts use verified Supabase sessions and receive an account-scoped balance.
- Advanced models remain locked until the account has credits.
- One credit represents `$0.001` of retail usage. Retail usage is settled at 2x the provider cost reported by OpenRouter.
- Chat transcripts stay in local browser storage. The database stores account and usage accounting data, not message text.
- Stripe Checkout is test-only. The browser submits only a pack ID; server constants decide price and credits.
- A signed webhook is the only path that grants purchased credits. Stripe event IDs and Checkout Session IDs make fulfillment idempotent.
- No real card should be entered. Use Stripe's `4242 4242 4242 4242` test card with any future expiry and CVC.

## Stripe test checkout

Set the server-only `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. The optional `STRIPE_PRICE_BUILDER`, `STRIPE_PRICE_PRO`, and `STRIPE_PRICE_STUDIO` variables should point to one-time USD test Prices. Do not prefix Stripe secrets with `NEXT_PUBLIC_`.

Configure the test webhook endpoint at:

```text
https://www.grokbuilding.com/api/stripe/webhook
```

Listen for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. A successful return to `/pricing` never grants credits by itself; it only refreshes the server balance while the signed webhook completes fulfillment.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

The production project is configured for `https://www.grokbuilding.com`. Canonicals, robots, sitemap, structured data, and Open Graph metadata use `NEXT_PUBLIC_SITE_URL`.
