import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    throw new Error("Stripe test mode is not configured.");
  }

  stripeClient = new Stripe(secretKey, {
    appInfo: {
      name: "Grok Building",
      url: "https://www.grokbuilding.com",
    },
  });
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !secret.startsWith("whsec_")) {
    throw new Error("Stripe webhook test secret is not configured.");
  }
  return secret;
}
