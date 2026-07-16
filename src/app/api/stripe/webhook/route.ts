import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getCheckoutCreditPack,
  isCreditPackId,
} from "@/lib/billing/credit-packs";
import { getStripe, getStripeWebhookSecret } from "@/lib/billing/stripe";
import { createSupabaseContext } from "@/lib/supabase/context";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function objectId(value: string | { id: string } | null) {
  if (!value) return "";
  return typeof value === "string" ? value : value.id;
}

async function fulfillCheckout(event: Stripe.Event, session: Stripe.Checkout.Session) {
  if (event.livemode || session.livemode) {
    throw new Error("Live Stripe events are disabled for this test integration.");
  }
  if (session.mode !== "payment" || session.payment_status !== "paid") return;

  const userId = session.metadata?.supabase_user_id;
  const packId = session.metadata?.pack_id;
  if (!userId || !isCreditPackId(packId)) {
    throw new Error("Stripe session metadata is incomplete.");
  }
  if (session.client_reference_id !== userId) {
    throw new Error("Stripe session user identity does not match.");
  }

  const pack = getCheckoutCreditPack(packId);
  if (
    session.amount_total !== pack.amountCents ||
    session.currency !== pack.currency ||
    session.metadata?.credits !== String(pack.credits)
  ) {
    throw new Error("Stripe session amount or credits do not match the pack.");
  }

  const { data: context, error: contextError } = await createSupabaseContext({
    auth: "none",
  });
  if (contextError || !context) throw new Error("Supabase admin is unavailable.");

  const admin = context.supabaseAdmin as unknown as SupabaseClient<Database>;
  const { data: authUser, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !authUser.user) throw new Error("Checkout user does not exist.");
  const checkoutEmail = session.customer_details?.email;
  if (
    checkoutEmail &&
    authUser.user.email &&
    checkoutEmail.toLowerCase() !== authUser.user.email.toLowerCase()
  ) {
    throw new Error("Checkout email does not match the account.");
  }

  const { error: fulfillmentError } = await admin.rpc(
    "fulfill_stripe_credit_purchase",
    {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
      p_livemode: event.livemode,
      p_checkout_session_id: session.id,
      p_payment_intent_id: objectId(session.payment_intent),
      p_stripe_customer_id: objectId(session.customer),
      p_user_id: userId,
      p_pack_id: pack.id,
      p_amount_total: pack.amountCents,
      p_currency: pack.currency,
      p_credits: pack.credits,
    },
  );
  if (fulfillmentError) throw fulfillmentError;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return Response.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await fulfillCheckout(event, event.data.object);
    }
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: "Stripe fulfillment failed and will be retried." },
      { status: 500 },
    );
  }
}
