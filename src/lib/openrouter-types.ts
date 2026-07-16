export type OpenRouterModel = {
  id: string;
  name: string;
  contextLength: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  inputModalities: string[];
  outputModalities: string[];
  supportedParameters: string[];
};

export type ChatRole = "user" | "assistant";

export type ChatMessagePayload = {
  role: ChatRole;
  content: string;
};

export const DEFAULT_XAI_MODEL = "x-ai/grok-build-0.1";

export const FALLBACK_XAI_MODELS: OpenRouterModel[] = [
  {
    id: "x-ai/grok-build-0.1",
    name: "xAI: Grok Build 0.1",
    contextLength: 256000,
    pricing: { prompt: "0.000001", completion: "0.000002" },
    inputModalities: ["text", "image", "file"],
    outputModalities: ["text"],
    supportedParameters: ["max_tokens", "temperature", "tools", "response_format"],
  },
  {
    id: "x-ai/grok-4.5",
    name: "xAI: Grok 4.5",
    contextLength: 500000,
    pricing: { prompt: "0.000002", completion: "0.000006" },
    inputModalities: ["text", "image", "file"],
    outputModalities: ["text"],
    supportedParameters: ["max_tokens", "temperature", "tools", "reasoning"],
  },
  {
    id: "x-ai/grok-4.3",
    name: "xAI: Grok 4.3",
    contextLength: 1000000,
    pricing: { prompt: "0.00000125", completion: "0.0000025" },
    inputModalities: ["text", "image", "file"],
    outputModalities: ["text"],
    supportedParameters: ["max_tokens", "temperature", "tools", "reasoning"],
  },
  {
    id: "x-ai/grok-4.20",
    name: "xAI: Grok 4.20",
    contextLength: 2000000,
    pricing: { prompt: "0.00000125", completion: "0.0000025" },
    inputModalities: ["text", "image", "file"],
    outputModalities: ["text"],
    supportedParameters: ["max_tokens", "temperature", "tools", "reasoning"],
  },
  {
    id: "x-ai/grok-4.20-multi-agent",
    name: "xAI: Grok 4.20 Multi-Agent",
    contextLength: 2000000,
    pricing: { prompt: "0.00000125", completion: "0.0000025" },
    inputModalities: ["text", "image", "file"],
    outputModalities: ["text"],
    supportedParameters: ["max_tokens", "temperature", "reasoning"],
  },
];

export function formatContextLength(value: number) {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return (Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1)) + "M";
  }
  return Math.round(value / 1000) + "K";
}

export function formatPerMillion(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "—";
  }
  return "$" + (number * 1000000).toFixed(number * 1000000 < 1 ? 2 : 2);
}
