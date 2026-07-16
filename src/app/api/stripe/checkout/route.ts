import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getCheckoutCreditPack,
  isCreditPackId,
} from "@/lib/billing/credit-packs";
import { getStripe } from "@/lib/billing/stripe";
import { getContextUser } from "@/lib/server-entitlements";
import { createSupabaseContext } from "@/lib/supabase/context";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 5;
type RateLimitEntry = { count: number; resetAt: number };

const globalCheckoutRateLimit = globalThis as typeof globalThis & {
  grokCheckoutRateLimit?: Map<string, RateLimitEntry>;
};
const checkoutRateLimit =
  globalCheckoutRateLimit.grokCheckoutRateLimit || new Map<string, RateLimitEntry>();
globalCheckoutRateLimit.grokCheckoutRateLimit = checkoutRateLimit;

function isRateLimited(key: string) {
  const now = Date.now();
  const current = checkoutRateLimit.get(key);
  if (!current || current.resetAt <= now) {
    checkoutRateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (current.count >= RATE_LIMIT_REQUESTS) return true;
  current.count += 1;
  return false;
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Invalid checkout origin." }, { status: 403 });
  }

  let body: { packId?: unknown; requestId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isCreditPackId(body.packId)) {
    return Response.json({ error: "Choose a valid credit pack." }, { status: 400 });
  }
  if (
    typeof body.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.requestId,
    )
  ) {
    return Response.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const { data: context, error: contextError } = await createSupabaseContext({
    auth: "user",
  });
  if (contextError || !context) {
    return Response.json({ error: "Sign in before buying credits." }, { status: 401 });
  }

  const user = getContextUser(context);
  if (!user) {
    return Response.json({ error: "Sign in before buying credits." }, { status: 401 });
  }
  if (isRateLimited(user.id)) {
    return Response.json(
      { error: "Too many checkout attempts. Please wait a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const pack = getCheckoutCreditPack(body.packId);
  const admin = context.supabaseAdmin as unknown as SupabaseClient<Database>;
  let customerId: string | null = null;

  try {
    const { data: existingCustomer, error: customerLookupError } = await admin
      .from("grok_stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (customerLookupError) throw customerLookupError;

    const stripe = getStripe();
    customerId = existingCustomer?.stripe_customer_id || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          app: "grokbuilding",
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      const { error: customerSaveError } = await admin
        .from("grok_stripe_customers")
        .upsert(
          {
            user_id: user.id,
            stripe_customer_id: customer.id,
            email: user.email,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      if (customerSaveError) throw customerSaveError;
    }

    const siteUrl = new URL(
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
    );
    const lineItem = pack.stripePriceId
      ? { price: pack.stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: pack.currency,
            unit_amount: pack.amountCents,
            product_data: {
              name: `${pack.name} credits`,
              description: `${pack.credits.toLocaleString("en-US")} Grok Building credits`,
              metadata: { app: "grokbuilding", pack_id: pack.id },
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [lineItem],
        metadata: {
          app: "grokbuilding",
          supabase_user_id: user.id,
          pack_id: pack.id,
          credits: String(pack.credits),
          pricing_version: "2026-07-v1",
        },
        payment_intent_data: {
          metadata: {
            app: "grokbuilding",
            supabase_user_id: user.id,
            pack_id: pack.id,
          },
        },
        success_url: new URL(
          "/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}",
          siteUrl,
        ).toString(),
        cancel_url: new URL("/pricing?checkout=cancelled", siteUrl).toString(),
      },
      { idempotencyKey: `grok_${user.id}_${body.requestId}` },
    );

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return Response.json(
      { url: session.url },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const setupError =
      error instanceof Error &&
      /not configured|relation .* does not exist|schema cache/i.test(error.message);
    return Response.json(
      {
        error: setupError
          ? "Test checkout is not ready yet. Complete the Stripe and Supabase setup."
          : "Checkout could not be opened. Please try again.",
      },
      { status: setupError ? 503 : 502 },
    );
  }
}
