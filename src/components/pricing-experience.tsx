"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Coins,
  Gauge,
  LockKeyhole,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  readDemoEntitlement,
  resetDemoEntitlement,
  writeDemoEntitlement,
} from "@/lib/client-entitlement";
import {
  DEFAULT_XAI_MODEL,
  FALLBACK_XAI_MODELS,
  formatContextLength,
  type OpenRouterModel,
} from "@/lib/openrouter-types";
import {
  CREDIT_PACKS,
  CREDIT_VALUE_USD,
  EMPTY_DEMO_ENTITLEMENT,
  FREE_QUESTION_LIMIT,
  PROVIDER_COST_MULTIPLIER,
  TYPICAL_INPUT_TOKENS,
  TYPICAL_OUTPUT_TOKENS,
  calculateCredits,
  formatCredits,
  formatUsd,
  isPremiumModel,
  providerRatePerMillion,
  retailRatePerMillion,
  typicalTurnCredits,
  type CreditPack,
  type DemoEntitlement,
} from "@/lib/pricing";

const usageExamples = [
  {
    label: "Quick fix",
    model: "Grok Build 0.1",
    context: "1K input + 500 output",
    credits: 4,
  },
  {
    label: "Repository review",
    model: "Grok 4.3",
    context: "10K input + 2K output",
    credits: 35,
  },
  {
    label: "Architecture session",
    model: "Grok 4.5",
    context: "20K input + 4K output",
    credits: 128,
  },
];

const pricingFaqs = [
  {
    question: "What do the first three free questions include?",
    answer:
      "They use Grok Build 0.1, the default basic model. A free question is counted only after a response is returned. Advanced models and additional questions require a positive credit balance.",
  },
  {
    question: "How are credits calculated?",
    answer:
      "One credit represents $0.001 of retail usage. The retail token rate is two times the current OpenRouter provider rate. Input and output are priced separately, so a long answer can cost more than a short one even when the prompt is identical.",
  },
  {
    question: "Why are advanced models locked?",
    answer:
      "Advanced models have different inference costs and are reserved for credit users. Grok Build 0.1 remains the low-cost default so a visitor can test the product before choosing a pack.",
  },
  {
    question: "Do unused credits expire or roll over?",
    answer:
      "This front-end preview does not expire credits. A production policy still needs to define expiry, rollover, refunds, account recovery, and spending alerts before checkout is enabled.",
  },
  {
    question: "Is a real payment processed on this page?",
    answer:
      "No. The pack buttons load demo credits into this browser only. There is no checkout, account, database, or payment fulfillment in this release.",
  },
  {
    question: "Is the current credit limit secure?",
    answer:
      "No. Browser storage is useful for interaction testing but can be changed or cleared by the visitor. Production access must validate identity and balance on the server, consume credits atomically, record a ledger event, and prevent duplicate charges on retries.",
  },
];

function modelShortName(model: OpenRouterModel) {
  return model.name.replace(/^xAI:\s*/i, "");
}

export function PricingExperience() {
  const [models, setModels] = useState<OpenRouterModel[]>(FALLBACK_XAI_MODELS);
  const [modelSource, setModelSource] = useState<"live" | "fallback">("fallback");
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_XAI_MODEL);
  const [inputTokens, setInputTokens] = useState(TYPICAL_INPUT_TOKENS);
  const [outputTokens, setOutputTokens] = useState(TYPICAL_OUTPUT_TOKENS);
  const [entitlement, setEntitlement] = useState<DemoEntitlement>(
    EMPTY_DEMO_ENTITLEMENT,
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadModels() {
      try {
        const response = await fetch("/api/models", { signal: controller.signal });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          data?: OpenRouterModel[];
          source?: "live" | "fallback";
        };
        if (payload.data?.length) {
          setModels(payload.data);
          setModelSource(payload.source === "live" ? "live" : "fallback");
        }
      } catch {
        // Static rates keep the calculator usable if the directory is unavailable.
      }
    }

    void loadModels();
    queueMicrotask(() => setEntitlement(readDemoEntitlement()));
    return () => controller.abort();
  }, []);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) || models[0],
    [models, selectedModelId],
  );

  const estimate = useMemo(() => {
    const providerCost =
      Number(selectedModel.pricing.prompt) * inputTokens +
      Number(selectedModel.pricing.completion) * outputTokens;
    return {
      providerCost,
      retailCost: providerCost * PROVIDER_COST_MULTIPLIER,
      credits: calculateCredits(selectedModel, inputTokens, outputTokens),
    };
  }, [inputTokens, outputTokens, selectedModel]);

  function activatePack(pack: CreditPack) {
    const next: DemoEntitlement = {
      credits: entitlement.credits + pack.credits,
      freeQuestionsUsed: entitlement.freeQuestionsUsed,
      activePack: pack.id,
      updatedAt: entitlement.updatedAt + 1,
    };
    setEntitlement(next);
    writeDemoEntitlement(next);
    setNotice(
      `${formatCredits(pack.credits)} demo credits loaded. Advanced models are now unlocked in this browser.`,
    );
  }

  function resetPreview() {
    resetDemoEntitlement();
    setEntitlement(EMPTY_DEMO_ENTITLEMENT);
    setNotice("Demo balance and free-question usage reset.");
  }

  return (
    <main id="top">
      <section className="border-b border-border dot-field">
        <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-16 sm:px-8 lg:pb-28 lg:pt-24">
          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              Pricing prototype
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="size-3.5 text-accent" />
              No payment is processed. Limits live in this browser only.
            </span>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="section-eyebrow">Simple usage pricing</p>
              <h1 className="mt-6 max-w-4xl text-4xl font-medium leading-[1.05] tracking-[-0.05em] text-foreground sm:text-6xl lg:text-8xl">
                Three questions free. Credits when you need more.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Grok Build 0.1 is the default basic model. Add credits to unlock
                every advanced xAI model, then pay for the input and output you use.
              </p>
            </div>

            <div className="border border-border bg-surface/55">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Browser balance
                </span>
                <span className="size-2 bg-success" />
              </div>
              <div className="grid grid-cols-2">
                <div className="border-r border-border p-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Free left
                  </p>
                  <p className="mt-3 text-3xl font-medium text-foreground">
                    {Math.max(0, FREE_QUESTION_LIMIT - entitlement.freeQuestionsUsed)}
                  </p>
                </div>
                <div className="p-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Credits
                  </p>
                  <p className="mt-3 text-3xl font-medium text-foreground">
                    {formatCredits(entitlement.credits)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-border p-4">
                <Button asChild size="sm">
                  <Link href="/#try-grok">
                    Open Grok Console
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={resetPreview}>
                  <RotateCcw className="size-3.5" />
                  Reset preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="section-eyebrow">Credit packs</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] text-foreground sm:text-5xl">
                One balance. Every Grok model.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground lg:justify-self-end">
              Every pack uses the same rate: 1,000 credits per dollar. Larger
              packs add capacity, not a hidden discount, so the two-times cost
              rule stays consistent.
            </p>
          </div>

          <div className="mt-12 grid border-l border-t border-border md:grid-cols-2 xl:grid-cols-4">
            <article className="flex min-h-[430px] flex-col border-b border-r border-border bg-surface/35 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-success">
                    Basic
                  </p>
                  <h3 className="mt-4 text-2xl font-medium">Free</h3>
                </div>
                <span className="font-mono text-xs text-muted-foreground">01</span>
              </div>
              <p className="mt-8 text-5xl font-medium tracking-[-0.05em]">$0</p>
              <p className="mt-3 text-sm text-muted-foreground">No card required</p>
              <ul className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
                <PlanFeature>3 successful questions</PlanFeature>
                <PlanFeature>Grok Build 0.1</PlanFeature>
                <PlanFeature>Streaming Markdown answers</PlanFeature>
              </ul>
              <Button asChild variant="outline" className="mt-auto">
                <Link href="/#try-grok">Try three questions</Link>
              </Button>
            </article>

            {CREDIT_PACKS.map((pack, index) => (
              <article
                key={pack.id}
                className="flex min-h-[430px] flex-col border-b border-r border-border p-6 data-[featured=true]:bg-accent/[0.035]"
                data-featured={pack.id === "pro"}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                      All models
                    </p>
                    <h3 className="mt-4 text-2xl font-medium">{pack.name}</h3>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 2}</span>
                </div>
                <div className="mt-8 flex items-end gap-2">
                  <p className="text-5xl font-medium tracking-[-0.05em]">
                    {formatUsd(pack.priceUsd, 0)}
                  </p>
                  <span className="pb-1 text-xs text-muted-foreground">one-time</span>
                </div>
                <p className="mt-3 font-mono text-xs text-accent">
                  {formatCredits(pack.credits)} credits
                </p>
                <p className="mt-6 text-sm leading-6 text-muted-foreground">
                  {pack.description}
                </p>
                <p className="mt-4 border-l border-border pl-3 text-xs leading-5 text-muted-foreground">
                  {pack.bestFor}
                </p>
                <Button
                  type="button"
                  variant={pack.id === "pro" ? "primary" : "outline"}
                  className="mt-auto"
                  onClick={() => activatePack(pack)}
                >
                  Load demo credits
                </Button>
              </article>
            ))}
          </div>

          {notice ? (
            <div className="mt-5 flex items-center gap-3 border-l-2 border-success bg-success/[0.06] px-5 py-4 text-sm text-foreground" role="status">
              <Check className="size-4 shrink-0 text-success" />
              {notice}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-border bg-surface/20">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="section-eyebrow">Rate calculator</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] text-foreground sm:text-5xl">
                See the cost before you send.
              </h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground">
                The estimate applies the current provider rate, doubles it, then
                converts the result at {formatUsd(CREDIT_VALUE_USD, 3)} per credit.
                Actual usage depends on the full conversation and returned answer.
              </p>
              <div className="mt-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className={modelSource === "live" ? "size-2 bg-success" : "size-2 bg-accent"} />
                {modelSource === "live" ? "Live OpenRouter rates" : "Verified fallback rates"}
              </div>
            </div>

            <div className="border border-border bg-background">
              <div className="grid border-b border-border md:grid-cols-3">
                <div className="border-b border-border p-5 md:border-b-0 md:border-r">
                  <label htmlFor="price-model" className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    Model
                  </label>
                  <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                    <SelectTrigger id="price-model" className="mt-3" aria-label="Choose a model for the credit estimate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {modelShortName(model)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <TokenField
                  id="input-tokens"
                  label="Input tokens"
                  value={inputTokens}
                  onChange={setInputTokens}
                />
                <TokenField
                  id="output-tokens"
                  label="Output tokens"
                  value={outputTokens}
                  onChange={setOutputTokens}
                  last
                />
              </div>

              <div className="grid md:grid-cols-3">
                <EstimateStat label="Provider cost" value={formatUsd(estimate.providerCost, 4)} />
                <EstimateStat label="Retail at 2×" value={formatUsd(estimate.retailCost, 4)} />
                <EstimateStat label="Estimated charge" value={`${formatCredits(estimate.credits)} cr`} accent />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="section-eyebrow">Model rates</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] text-foreground sm:text-5xl">
                Basic by default. Advanced by choice.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Typical turn estimates use 2,000 input tokens and 1,000 output tokens.
              Longer conversation history increases the input charge.
            </p>
          </div>

          <div className="mt-12 overflow-x-auto border border-border">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead className="bg-surface/60 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="border-b border-r border-border px-5 py-4 font-normal">Model</th>
                  <th className="border-b border-r border-border px-5 py-4 font-normal">Tier</th>
                  <th className="border-b border-r border-border px-5 py-4 font-normal">Context</th>
                  <th className="border-b border-r border-border px-5 py-4 font-normal">Provider $ / 1M in · out</th>
                  <th className="border-b border-r border-border px-5 py-4 font-normal">Retail $ / 1M in · out</th>
                  <th className="border-b border-border px-5 py-4 font-normal">Typical turn</th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.id} className="text-sm text-foreground">
                    <td className="border-b border-r border-border px-5 py-5 font-medium">
                      {modelShortName(model)}
                    </td>
                    <td className="border-b border-r border-border px-5 py-5">
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        {isPremiumModel(model.id) ? (
                          <LockKeyhole className="size-3.5 text-accent" />
                        ) : (
                          <Sparkles className="size-3.5 text-success" />
                        )}
                        {isPremiumModel(model.id) ? "Advanced" : "Basic"}
                      </span>
                    </td>
                    <td className="border-b border-r border-border px-5 py-5 font-mono text-xs text-muted-foreground">
                      {formatContextLength(model.contextLength)}
                    </td>
                    <td className="border-b border-r border-border px-5 py-5 font-mono text-xs text-muted-foreground">
                      {formatUsd(providerRatePerMillion(model.pricing.prompt))} · {formatUsd(providerRatePerMillion(model.pricing.completion))}
                    </td>
                    <td className="border-b border-r border-border px-5 py-5 font-mono text-xs text-muted-foreground">
                      {formatUsd(retailRatePerMillion(model.pricing.prompt))} · {formatUsd(retailRatePerMillion(model.pricing.completion))}
                    </td>
                    <td className="border-b border-border px-5 py-5 font-mono text-xs text-accent">
                      ≈ {formatCredits(typicalTurnCredits(model))} cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface/20">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="section-eyebrow">Example usage</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] text-foreground sm:text-5xl">
                Three concrete bills.
              </h2>
            </div>
            <div className="border-t border-border">
              {usageExamples.map((example, index) => (
                <article key={example.label} className="grid gap-4 border-b border-border py-6 sm:grid-cols-[55px_0.8fr_1fr_auto] sm:items-center">
                  <span className="font-mono text-[9px] text-accent">0{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{example.label}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{example.model}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{example.context}</p>
                  <p className="font-mono text-sm text-foreground">{example.credits} credits</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr]">
            <div>
              <p className="section-eyebrow">Pricing Q&amp;A</p>
              <h2 className="mt-5 text-4xl font-medium tracking-[-0.045em] text-foreground sm:text-5xl">
                Know what happens before you spend.
              </h2>
            </div>
            <div className="border-t border-border">
              {pricingFaqs.map((faq, index) => (
                <article key={faq.question} className="grid gap-4 border-b border-border py-7 sm:grid-cols-[55px_1fr]">
                  <span className="font-mono text-[9px] text-accent">0{index + 1}</span>
                  <div>
                    <h3 className="text-base font-medium text-foreground">{faq.question}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-1 size-3.5 shrink-0 text-success" />
      <span>{children}</span>
    </li>
  );
}

function TokenField({
  id,
  label,
  value,
  onChange,
  last = false,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  last?: boolean;
}) {
  return (
    <div className={`border-b border-border p-5 md:border-b-0 ${last ? "" : "md:border-r"}`}>
      <label htmlFor={id} className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        max={2000000}
        step={100}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="mt-3 h-10 w-full border border-border bg-surface px-3 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}

function EstimateStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-border p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="flex items-center gap-2">
        {accent ? <Coins className="size-3.5 text-accent" /> : <Gauge className="size-3.5 text-muted-foreground" />}
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`mt-4 font-mono text-2xl ${accent ? "text-accent" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
