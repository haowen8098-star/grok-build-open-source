import { randomUUID } from "node:crypto";

import type { ChatMessagePayload, OpenRouterModel } from "@/lib/openrouter-types";
import {
  FALLBACK_XAI_MODELS,
} from "@/lib/openrouter-types";
import { resolveGuestIdentity } from "@/lib/guest-identity";
import {
  calculateCredits,
  CREDIT_VALUE_USD,
  estimateTokens,
  PROVIDER_COST_MULTIPLIER,
} from "@/lib/pricing";
import {
  getContextUser,
  releaseUsage,
  reserveUsage,
  settleUsage,
} from "@/lib/server-entitlements";
import { createSupabaseContext } from "@/lib/supabase/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 24000;
const MAX_TOTAL_LENGTH = 100000;
const MAX_OUTPUT_TOKENS = 4096;
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_REQUESTS = 20;

type RateLimitEntry = { count: number; resetAt: number };
type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  cost?: number;
};
type OpenRouterChunk = {
  id?: string;
  usage?: OpenRouterUsage;
  error?: { message?: string };
  choices?: Array<{ delta?: { content?: string } }>;
};

const globalRateLimit = globalThis as typeof globalThis & {
  grokConsoleRateLimit?: Map<string, RateLimitEntry>;
};
const rateLimitStore =
  globalRateLimit.grokConsoleRateLimit || new Map<string, RateLimitEntry>();
globalRateLimit.grokConsoleRateLimit = rateLimitStore;

function getClientId(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function checkRateLimit(clientId: string) {
  const now = Date.now();
  const current = rateLimitStore.get(clientId);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function isValidModel(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^x-ai\/[a-zA-Z0-9._:-]+$/.test(value) &&
    value.length <= 100
  );
}

function normalizeMessages(value: unknown): ChatMessagePayload[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return null;
  }

  let totalLength = 0;
  const messages: ChatMessagePayload[] = [];
  for (const message of value) {
    if (
      !message ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string"
    ) {
      return null;
    }
    const content = message.content.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) return null;
    totalLength += content.length;
    if (totalLength > MAX_TOTAL_LENGTH) return null;
    messages.push({ role: message.role, content });
  }
  return messages[messages.length - 1]?.role === "user" ? messages : null;
}

function responseHeaders(guestCookie: string | null) {
  const headers: HeadersInit = { "Cache-Control": "no-store" };
  if (guestCookie) headers["Set-Cookie"] = guestCookie;
  return headers;
}

function errorResponse(
  message: string,
  status: number,
  guestCookie: string | null,
  retryAfter?: number,
) {
  const headers = responseHeaders(guestCookie);
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return Response.json({ error: message }, { status, headers });
}

async function getModel(modelId: string): Promise<OpenRouterModel | null> {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      next: { revalidate: 900 },
    });
    if (!response.ok) throw new Error("model catalog unavailable");
    const payload = (await response.json()) as {
      data?: Array<{
        id?: string;
        name?: string;
        context_length?: number;
        pricing?: { prompt?: string; completion?: string };
        architecture?: {
          input_modalities?: string[];
          output_modalities?: string[];
        };
        supported_parameters?: string[];
      }>;
    };
    const match = payload.data?.find((model) => model.id === modelId);
    if (!match?.id) return null;
    return {
      id: match.id,
      name: match.name || match.id,
      contextLength: match.context_length || 0,
      pricing: {
        prompt: match.pricing?.prompt || "0",
        completion: match.pricing?.completion || "0",
      },
      inputModalities: match.architecture?.input_modalities || ["text"],
      outputModalities: match.architecture?.output_modalities || ["text"],
      supportedParameters: match.supported_parameters || [],
    };
  } catch {
    return FALLBACK_XAI_MODELS.find((model) => model.id === modelId) || null;
  }
}

function creditsFromProviderCost(cost: number) {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const credits = (cost * PROVIDER_COST_MULTIPLIER) / CREDIT_VALUE_USD;
  return Math.max(0.01, Math.ceil(credits * 100) / 100);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const guest = resolveGuestIdentity(request);
  if (!apiKey) {
    return errorResponse(
      "OpenRouter is not configured on this server.",
      503,
      guest.setCookie,
    );
  }

  const rateLimit = checkRateLimit(getClientId(request));
  if (!rateLimit.allowed) {
    return errorResponse(
      "Too many requests. Please wait before trying again.",
      429,
      guest.setCookie,
      rateLimit.retryAfter,
    );
  }

  let body: { model?: unknown; messages?: unknown; temperature?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400, guest.setCookie);
  }

  if (!isValidModel(body.model)) {
    return errorResponse("Choose a valid xAI model.", 400, guest.setCookie);
  }
  const messages = normalizeMessages(body.messages);
  if (!messages) {
    return errorResponse(
      "The conversation payload is invalid or too large.",
      400,
      guest.setCookie,
    );
  }

  const model = await getModel(body.model);
  if (!model) {
    return errorResponse("That xAI model is not currently available.", 400, guest.setCookie);
  }

  const { data: context, error: contextError } = await createSupabaseContext({
    auth: ["user", "none"],
  });
  if (contextError || !context) {
    return errorResponse(
      "Account service is temporarily unavailable.",
      503,
      guest.setCookie,
    );
  }

  const requestId = randomUUID();
  const inputTokenEstimate = messages.reduce(
    (total, message) => total + estimateTokens(message.content),
    0,
  );
  const reservedCredits = calculateCredits(
    model,
    inputTokenEstimate,
    MAX_OUTPUT_TOKENS,
  );

  let reservation;
  try {
    reservation = await reserveUsage(context, guest, {
      requestId,
      model: model.id,
      reservedCredits,
    });
  } catch {
    return errorResponse(
      "Usage limits are not ready. Apply the Supabase migration.",
      503,
      guest.setCookie,
    );
  }

  if (!reservation.allowed) {
    const isGuestLimit = reservation.reason === "guest_limit_reached";
    const isAdvancedGuest =
      reservation.reason === "advanced_model_requires_credits";
    return errorResponse(
      isAdvancedGuest
        ? "Advanced models require a signed-in account with credits."
        : isGuestLimit
          ? "Your three guest questions are used. Sign in to continue."
          : "You do not have enough credits for this request.",
      isGuestLimit || isAdvancedGuest ? 403 : 402,
      guest.setCookie,
    );
  }

  const requestedTemperature =
    typeof body.temperature === "number" ? body.temperature : 0.2;
  const temperature = Math.min(1.5, Math.max(0, requestedTemperature));
  const systemMessage = {
    role: "system",
    content:
      "You are running inside Grok Console, an independent developer interface powered through OpenRouter. Be direct, technically precise, and useful. Prefer correct code and concrete steps. Use Markdown when it improves clarity. Never claim access to files, tools, browsing, or runtime state unless the user supplied that information in the conversation.",
  };
  const user = getContextUser(context);

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
        "X-Title": process.env.OPENROUTER_APP_TITLE || "Grok Building",
      },
      body: JSON.stringify({
        model: model.id,
        messages: [systemMessage, ...messages],
        stream: true,
        temperature,
        max_tokens: MAX_OUTPUT_TOKENS,
        user: user?.id || guest.guestHash.slice(0, 64),
      }),
      signal: request.signal,
    });
  } catch {
    await releaseUsage(context, requestId, "Could not reach OpenRouter.");
    return errorResponse(
      "Could not reach OpenRouter. Please try again.",
      502,
      guest.setCookie,
    );
  }

  if (!upstream.ok) {
    const payload = (await upstream.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    const message =
      payload?.error?.message ||
      (upstream.status === 402
        ? "The OpenRouter account has insufficient credits."
        : "OpenRouter rejected the request.");
    await releaseUsage(context, requestId, message);
    return errorResponse(
      message,
      upstream.status,
      guest.setCookie,
      Number(upstream.headers.get("Retry-After")) || undefined,
    );
  }

  if (!upstream.body) {
    await releaseUsage(context, requestId, "OpenRouter returned an empty stream.");
    return errorResponse(
      "OpenRouter returned an empty stream.",
      502,
      guest.setCookie,
    );
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let responseText = "";
  let usage: OpenRouterUsage | null = null;
  let generationId = upstream.headers.get("X-Generation-Id") || "";
  let finalized = false;

  const parseChunk = (text: string) => {
    buffer += text;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const chunk = JSON.parse(data) as OpenRouterChunk;
        if (chunk.id) generationId = chunk.id;
        if (chunk.usage) usage = chunk.usage;
        responseText += chunk.choices?.[0]?.delta?.content || "";
      } catch {
        // Ignore keepalive and non-JSON SSE frames.
      }
    }
  };

  const finalize = async (success: boolean, errorMessage = "") => {
    if (finalized) return;
    finalized = true;
    if (!success) {
      await releaseUsage(context, requestId, errorMessage || "Stream interrupted.");
      return;
    }

    const promptTokens = Number(usage?.prompt_tokens || inputTokenEstimate);
    const completionTokens = Number(
      usage?.completion_tokens || estimateTokens(responseText),
    );
    const providerCost = Number(usage?.cost || 0);
    const actualCredits = providerCost
      ? creditsFromProviderCost(providerCost)
      : calculateCredits(model, promptTokens, completionTokens);

    await settleUsage(context, {
      requestId,
      actualCredits,
      providerCostUsd: providerCost,
      promptTokens,
      completionTokens,
      generationId,
    });
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parseChunk(decoder.decode(value, { stream: true }));
          controller.enqueue(value);
        }
        parseChunk(decoder.decode());
        await finalize(Boolean(responseText));
        controller.close();
      } catch (error) {
        await finalize(
          false,
          error instanceof Error ? error.message : "Stream interrupted.",
        );
        controller.error(error);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
      await finalize(false, "Request cancelled by client.");
    },
  });

  const headers: HeadersInit = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream; charset=utf-8",
    "X-Accel-Buffering": "no",
    "X-OpenRouter-Model": model.id,
    "X-Usage-Request": requestId,
  };
  if (guest.setCookie) headers["Set-Cookie"] = guest.setCookie;

  return new Response(stream, { status: 200, headers });
}
