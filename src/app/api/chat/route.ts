import type { ChatMessagePayload } from "@/lib/openrouter-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 24000;
const MAX_TOTAL_LENGTH = 100000;
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_REQUESTS = 20;

type RateLimitEntry = {
  count: number;
  resetAt: number;
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
    if (!content || content.length > MAX_MESSAGE_LENGTH) {
      return null;
    }

    totalLength += content.length;
    if (totalLength > MAX_TOTAL_LENGTH) {
      return null;
    }

    messages.push({
      role: message.role,
      content,
    });
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return null;
  }

  return messages;
}

function errorResponse(message: string, status: number, retryAfter?: number) {
  const headers: HeadersInit = {
    "Cache-Control": "no-store",
  };
  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return errorResponse("OpenRouter is not configured on this server.", 503);
  }

  const rateLimit = checkRateLimit(getClientId(request));
  if (!rateLimit.allowed) {
    return errorResponse(
      "Too many requests. Please wait before trying again.",
      429,
      rateLimit.retryAfter,
    );
  }

  let body: {
    model?: unknown;
    messages?: unknown;
    temperature?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  if (!isValidModel(body.model)) {
    return errorResponse("Choose a valid xAI model.", 400);
  }

  const messages = normalizeMessages(body.messages);
  if (!messages) {
    return errorResponse("The conversation payload is invalid or too large.", 400);
  }

  const requestedTemperature =
    typeof body.temperature === "number" ? body.temperature : 0.2;
  const temperature = Math.min(1.5, Math.max(0, requestedTemperature));

  const systemMessage = {
    role: "system",
    content:
      "You are running inside Grok Console, an independent developer interface powered through OpenRouter. Be direct, technically precise, and useful. Prefer correct code and concrete steps. Use Markdown when it improves clarity. Never claim access to files, tools, browsing, or runtime state unless the user supplied that information in the conversation.",
  };

  let upstream: Response;

  try {
    upstream = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
        "X-Title":
          process.env.OPENROUTER_APP_TITLE || "Grok Build Open Source",
      },
      body: JSON.stringify({
        model: body.model,
        messages: [systemMessage, ...messages],
        stream: true,
        temperature,
        max_tokens: 4096,
      }),
      signal: request.signal,
    });
  } catch {
    return errorResponse("Could not reach OpenRouter. Please try again.", 502);
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
    return errorResponse(
      message,
      upstream.status,
      Number(upstream.headers.get("Retry-After")) || undefined,
    );
  }

  if (!upstream.body) {
    return errorResponse("OpenRouter returned an empty stream.", 502);
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
      "X-OpenRouter-Model": body.model,
    },
  });
}
