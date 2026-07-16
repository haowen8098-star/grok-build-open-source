import {
  DEFAULT_XAI_MODEL,
  type ChatMessagePayload,
  type OpenRouterModel,
} from "@/lib/openrouter-types";

export const FREE_QUESTION_LIMIT = 3;
export const PROVIDER_COST_MULTIPLIER = 2;
export const CREDIT_VALUE_USD = 0.001;
export const TYPICAL_INPUT_TOKENS = 2000;
export const TYPICAL_OUTPUT_TOKENS = 1000;

export type CreditPack = {
  id: "builder" | "pro" | "studio";
  name: string;
  priceUsd: number;
  credits: number;
  description: string;
  bestFor: string;
};

export type DemoEntitlement = {
  credits: number;
  freeQuestionsUsed: number;
  activePack: CreditPack["id"] | null;
  updatedAt: number;
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "builder",
    name: "Builder",
    priceUsd: 10,
    credits: 10000,
    description: "A focused pack for individual coding sessions.",
    bestFor: "Occasional debugging and implementation work",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 25,
    credits: 25000,
    description: "More room for long context and advanced Grok models.",
    bestFor: "Regular development and architecture reviews",
  },
  {
    id: "studio",
    name: "Studio",
    priceUsd: 50,
    credits: 50000,
    description: "A larger balance for intensive evaluation and team demos.",
    bestFor: "Heavy testing and multi-model comparisons",
  },
];

export const EMPTY_DEMO_ENTITLEMENT: DemoEntitlement = {
  credits: 0,
  freeQuestionsUsed: 0,
  activePack: null,
  updatedAt: 0,
};

export function isPremiumModel(modelId: string) {
  return modelId !== DEFAULT_XAI_MODEL;
}

export function providerRatePerMillion(value: string) {
  const rate = Number(value) * 1000000;
  return Number.isFinite(rate) ? rate : 0;
}

export function retailRatePerMillion(value: string) {
  return providerRatePerMillion(value) * PROVIDER_COST_MULTIPLIER;
}

export function creditsPerMillion(value: string) {
  return retailRatePerMillion(value) / CREDIT_VALUE_USD;
}

export function estimateTokens(text: string) {
  const cjkCharacters = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const otherCharacters = Math.max(0, text.length - cjkCharacters);
  return Math.max(1, Math.ceil(cjkCharacters + otherCharacters / 4));
}

export function calculateCredits(
  model: OpenRouterModel,
  inputTokens: number,
  outputTokens: number,
) {
  const providerCost =
    Number(model.pricing.prompt) * Math.max(0, inputTokens) +
    Number(model.pricing.completion) * Math.max(0, outputTokens);
  const credits =
    (providerCost * PROVIDER_COST_MULTIPLIER) / CREDIT_VALUE_USD;
  if (credits <= 0) return 0;
  return Math.max(0.01, Math.ceil(credits * 100) / 100);
}

export function estimateConversationCredits(
  model: OpenRouterModel,
  conversation: ChatMessagePayload[],
  responseText: string,
) {
  const inputTokens = conversation.reduce(
    (total, message) => total + estimateTokens(message.content),
    0,
  );
  const outputTokens = estimateTokens(responseText);
  return calculateCredits(model, inputTokens, outputTokens);
}

export function typicalTurnCredits(model: OpenRouterModel) {
  return calculateCredits(
    model,
    TYPICAL_INPUT_TOKENS,
    TYPICAL_OUTPUT_TOKENS,
  );
}

export function formatCredits(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUsd(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
