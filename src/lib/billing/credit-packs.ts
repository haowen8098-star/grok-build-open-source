import "server-only";

import { CREDIT_PACKS, type CreditPack } from "@/lib/pricing";

export type CreditPackId = CreditPack["id"];

export type CheckoutCreditPack = CreditPack & {
  amountCents: number;
  currency: "usd";
  stripePriceId: string | null;
};

const priceEnvByPack: Record<CreditPackId, string | undefined> = {
  builder: process.env.STRIPE_PRICE_BUILDER,
  pro: process.env.STRIPE_PRICE_PRO,
  studio: process.env.STRIPE_PRICE_STUDIO,
};

export function isCreditPackId(value: unknown): value is CreditPackId {
  return value === "builder" || value === "pro" || value === "studio";
}

export function getCheckoutCreditPack(id: CreditPackId): CheckoutCreditPack {
  const pack = CREDIT_PACKS.find((candidate) => candidate.id === id);
  if (!pack) throw new Error("Unknown credit pack.");

  const configuredPriceId = priceEnvByPack[id]?.trim();
  return {
    ...pack,
    amountCents: pack.priceUsd * 100,
    currency: "usd",
    stripePriceId:
      configuredPriceId && configuredPriceId.startsWith("price_")
        ? configuredPriceId
        : null,
  };
}
