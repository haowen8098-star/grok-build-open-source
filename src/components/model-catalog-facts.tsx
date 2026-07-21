"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  FALLBACK_XAI_MODELS,
  formatContextLength,
  formatPerMillion,
  type OpenRouterModel,
} from "@/lib/openrouter-types";
import { modelPageConfigs } from "@/lib/model-pages";
import { cn } from "@/lib/utils";

function useModelCatalog() {
  const [models, setModels] = useState<OpenRouterModel[]>(FALLBACK_XAI_MODELS);
  const [source, setSource] = useState<"loading" | "live" | "fallback">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/models", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Model directory unavailable");
        const payload = (await response.json()) as {
          data?: OpenRouterModel[];
          source?: "live" | "fallback";
        };
        setModels(payload.data?.length ? payload.data : FALLBACK_XAI_MODELS);
        setSource(payload.source === "live" ? "live" : "fallback");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSource("fallback");
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  return { models, source };
}

function sourceLabel(source: "loading" | "live" | "fallback") {
  if (source === "live") return "Live directory";
  if (source === "fallback") return "Cached directory";
  return "Checking directory";
}

export function ModelLiveFacts({ modelId }: { modelId: string }) {
  const { models, source } = useModelCatalog();
  const model = useMemo(
    () => models.find((candidate) => candidate.id === modelId),
    [modelId, models],
  );
  const fallback = FALLBACK_XAI_MODELS.find((candidate) => candidate.id === modelId);
  const displayModel = model || fallback;
  const unavailable = source === "live" && !model;

  return (
    <div className="border-y border-border bg-surface/35">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 sm:px-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Current route facts
        </span>
        <span className="status-label">
          <span
            className={cn(
              "size-1.5 rounded-full",
              unavailable ? "bg-destructive" : source === "live" ? "bg-success" : "bg-accent",
            )}
          />
          {unavailable ? "Currently unavailable" : sourceLabel(source)}
        </span>
      </div>
      <dl className="grid sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Model route", modelId],
          ["Provider context", displayModel ? formatContextLength(displayModel.contextLength) : "—"],
          ["Input / 1M", displayModel ? formatPerMillion(displayModel.pricing.prompt) : "—"],
          ["Output / 1M", displayModel ? formatPerMillion(displayModel.pricing.completion) : "—"],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={cn(
              "min-w-0 px-5 py-5 sm:px-6",
              index < 3 && "border-border lg:border-r",
              index % 2 === 0 && "sm:border-r",
              index < 2 && "border-b sm:border-b lg:border-b-0",
              index === 1 && "sm:border-r-0 lg:border-r",
            )}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-2 truncate font-mono text-sm text-foreground" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-border px-5 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
        Price, provider context, and availability are read from the site&apos;s current OpenRouter-backed model directory. They may change.
      </p>
    </div>
  );
}

export function ModelComparisonTable({ currentModelId }: { currentModelId: string }) {
  const { models, source } = useModelCatalog();

  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead className="bg-surface/50 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-semibold">Model</th>
            <th className="px-5 py-3 font-semibold">Provider context</th>
            <th className="px-5 py-3 font-semibold">Input / 1M</th>
            <th className="px-5 py-3 font-semibold">Output / 1M</th>
            <th className="px-5 py-3 font-semibold">Route</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {modelPageConfigs.map((page) => {
            const liveModel = models.find((model) => model.id === page.modelId);
            const model = liveModel || FALLBACK_XAI_MODELS.find((item) => item.id === page.modelId);
            const unavailable = source === "live" && !liveModel;
            return (
              <tr key={page.modelId} className={cn(page.modelId === currentModelId && "bg-accent/5")}>
                <th className="px-5 py-4 font-medium text-foreground">
                  <Link href={`/models/${page.slug}`} className="underline decoration-accent underline-offset-4 hover:text-accent">
                    {page.name}
                  </Link>
                </th>
                <td className="px-5 py-4 font-mono text-muted-foreground">
                  {model ? formatContextLength(model.contextLength) : "—"}
                </td>
                <td className="px-5 py-4 font-mono text-muted-foreground">
                  {model ? formatPerMillion(model.pricing.prompt) : "—"}
                </td>
                <td className="px-5 py-4 font-mono text-muted-foreground">
                  {model ? formatPerMillion(model.pricing.completion) : "—"}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {unavailable ? "Unavailable" : source === "live" ? "Active" : "Cached"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
