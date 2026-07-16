import { NextResponse } from "next/server";

import {
  DEFAULT_XAI_MODEL,
  FALLBACK_XAI_MODELS,
  type OpenRouterModel,
} from "@/lib/openrouter-types";

type UpstreamModel = {
  id?: string;
  name?: string;
  created?: number;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  supported_parameters?: string[];
};

function normalizeModel(model: UpstreamModel): OpenRouterModel | null {
  if (!model.id?.startsWith("x-ai/")) {
    return null;
  }

  return {
    id: model.id,
    name: model.name || model.id.replace("x-ai/", "xAI: "),
    contextLength: model.context_length || 0,
    pricing: {
      prompt: model.pricing?.prompt || "0",
      completion: model.pricing?.completion || "0",
    },
    inputModalities: model.architecture?.input_modalities || ["text"],
    outputModalities: model.architecture?.output_modalities || ["text"],
    supportedParameters: model.supported_parameters || [],
  };
}

function sortModels(models: OpenRouterModel[]) {
  return models.sort((a, b) => {
    if (a.id === DEFAULT_XAI_MODEL) return -1;
    if (b.id === DEFAULT_XAI_MODEL) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 900,
      },
    });

    if (!response.ok) {
      throw new Error("OpenRouter model directory returned " + response.status);
    }

    const payload = (await response.json()) as { data?: UpstreamModel[] };
    const models = sortModels(
      (payload.data || [])
        .map(normalizeModel)
        .filter((model): model is OpenRouterModel => model !== null),
    );

    if (models.length === 0) {
      throw new Error("No xAI models were returned");
    }

    return NextResponse.json(
      {
        data: models,
        defaultModel: DEFAULT_XAI_MODEL,
        source: "live",
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        data: FALLBACK_XAI_MODELS,
        defaultModel: DEFAULT_XAI_MODEL,
        source: "fallback",
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  }
}
