import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, CheckCircle2, LockKeyhole } from "lucide-react";

import { GrokConsole } from "@/components/grok-console";
import { MotionLine, MotionReveal } from "@/components/model-page-motion";
import {
  ModelComparisonTable,
  ModelLiveFacts,
} from "@/components/model-catalog-facts";
import { SiteHeader } from "@/components/site-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { getModelPage, modelPageConfigs } from "@/lib/model-pages";
import { siteConfig } from "@/lib/site-config";

type ModelPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return modelPageConfigs.map((model) => ({ slug: model.slug }));
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelPage(slug);
  if (!model) return {};

  const path = `/models/${model.slug}`;
  return {
    title: model.metaTitle,
    description: model.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title: model.metaTitle,
      description: model.description,
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary",
      title: model.metaTitle,
      description: model.description,
    },
  };
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { slug } = await params;
  const model = getModelPage(slug);
  if (!model) notFound();

  const url = `${siteConfig.url}/models/${model.slug}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Grok Building", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Model guide", item: `${siteConfig.url}/#model-guide` },
        { "@type": "ListItem", position: 3, name: model.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: `${model.name} Online Console`,
      url,
      description: model.description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      browserRequirements: "JavaScript required",
      provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: model.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="site-grid min-h-screen">
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:py-20">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Grok Building</Link>
              <span aria-hidden="true">/</span>
              <Link href="/#model-guide" className="hover:text-foreground">Model guide</Link>
              <span aria-hidden="true">/</span>
              <span className="text-foreground">{model.name}</span>
            </nav>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.65fr)] lg:items-end">
              <MotionReveal preserveOpacity>
                <p className="section-eyebrow">xAI model / exact route</p>
                <h1 className="mt-5 max-w-4xl text-4xl font-medium tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
                  {model.title}
                </h1>
              </MotionReveal>
              <MotionReveal
                preserveOpacity
                className="border-l border-border pl-5 sm:pl-7"
                delay={0.08}
              >
                <p className="text-base leading-8 text-muted-foreground">{model.summary}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <a href="#try-model">
                      Try {model.name}
                      <ArrowRight className="size-3.5" />
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/pricing">View pricing</Link>
                  </Button>
                </div>
              </MotionReveal>
            </div>

            <p className="mt-10 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Search intent: {model.searchIntent}
            </p>
          </div>
        </section>

        <section aria-labelledby="model-facts" className="border-b border-border">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:py-16">
            <div className="mb-7 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="section-eyebrow">01 / Model facts</p>
                <h2 id="model-facts" className="mt-4 text-3xl font-medium tracking-[-0.04em] text-foreground">
                  Live route, not a frozen price card.
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground lg:justify-self-end">
                The provider directory supplies the mutable facts below. Official xAI documentation supplies model positioning; this page does not infer benchmark leadership.
              </p>
            </div>
            <MotionReveal>
              <ModelLiveFacts modelId={model.modelId} />
            </MotionReveal>
          </div>
        </section>

        <section aria-labelledby="use-cases" className="border-b border-border">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:py-20">
            <p className="section-eyebrow">02 / Good fit</p>
            <h2 id="use-cases" className="mt-4 max-w-3xl text-3xl font-medium tracking-[-0.04em] text-foreground sm:text-4xl">
              Choose the model for a concrete job.
            </h2>
            <div className="mt-10 grid border-t border-border lg:grid-cols-3">
              {model.useCases.map((useCase, index) => (
                <MotionLine
                  key={useCase.title}
                  delay={index * 0.07}
                  className="border-b border-border py-7 lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                >
                  <article>
                    <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                    <h3 className="mt-5 text-xl font-medium tracking-[-0.025em] text-foreground">{useCase.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{useCase.description}</p>
                  </article>
                </MotionLine>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="console-limits" className="border-b border-border bg-surface/25">
          <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:py-16">
            <div>
              <p className="section-eyebrow">03 / Console limits</p>
              <h2 id="console-limits" className="mt-4 text-3xl font-medium tracking-[-0.04em] text-foreground">
                Model capability and site access are different.
              </h2>
            </div>
            <MotionReveal>
              <ul className="divide-y divide-border border-y border-border">
              {model.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-3 py-5 text-sm leading-7 text-muted-foreground">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{limitation}</span>
                </li>
              ))}
              </ul>
            </MotionReveal>
          </div>
        </section>

        <section id="try-model" aria-labelledby="try-model-heading" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:py-20">
            <div className="mb-8 grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <p className="section-eyebrow">04 / Online Console</p>
                <h2 id="try-model-heading" className="mt-4 text-3xl font-medium tracking-[-0.04em] text-foreground sm:text-4xl">
                  Try {model.name} on its exact route.
                </h2>
              </div>
              <div className="flex items-start gap-3 border-l border-border pl-5 text-sm leading-7 text-muted-foreground lg:justify-self-end">
                <LockKeyhole className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                <p className="max-w-xl">
                  This selector is fixed to <span className="font-mono text-foreground">{model.modelId}</span>. A stored preference cannot replace it.
                </p>
              </div>
            </div>
            <MotionReveal>
              <GrokConsole
                initialModelId={model.modelId}
                lockModel
                starterPrompts={model.starterPrompts}
              />
            </MotionReveal>
          </div>
        </section>

        <section aria-labelledby="comparison" className="border-b border-border">
          <div className="mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="section-eyebrow">05 / Compare</p>
                <h2 id="comparison" className="mt-4 text-3xl font-medium tracking-[-0.04em] text-foreground">
                  Compare the current Grok routes.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                  Provider context is capacity, not a recommendation to send everything. Use the smallest relevant input and choose by task.
                </p>
              </div>
              <MotionReveal>
                <ModelComparisonTable currentModelId={model.modelId} />
              </MotionReveal>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5 text-sm">
              <Link href="/#model-guide" className="inline-flex items-center gap-2 text-foreground hover:text-accent">
                Grok Build model guide <ArrowRight className="size-3.5" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                Credits and pricing <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="faq" className="border-b border-border bg-surface/20">
          <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:py-20">
            <div>
              <p className="section-eyebrow">06 / FAQ</p>
              <h2 id="faq" className="mt-4 text-3xl font-medium tracking-[-0.04em] text-foreground">
                {model.name} questions, answered precisely.
              </h2>
            </div>
            <MotionReveal>
              <Accordion type="single" collapsible className="border-t border-border">
                {model.faqs.map((faq, index) => (
                  <AccordionItem value={`faq-${index}`} key={faq.question}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </MotionReveal>
          </div>
        </section>

        <section aria-labelledby="sources" className="border-b border-border">
          <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:py-16">
            <div>
              <p className="section-eyebrow">Sources & ownership</p>
              <h2 id="sources" className="mt-4 text-2xl font-medium tracking-[-0.03em] text-foreground">
                Independent interface, named sources.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Grok Building is an independent developer guide and interface. It is not an official xAI product. Model access on this site is provided through OpenRouter.
              </p>
            </div>
            <ul className="divide-y divide-border border-y border-border">
              {model.sources.map((source) => (
                <li key={source.href} className="py-5">
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-foreground underline decoration-accent underline-offset-4 hover:text-accent"
                  >
                    {source.label}
                    <ArrowUpRight className="size-3.5" />
                  </a>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{source.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-5 py-7 text-xs text-muted-foreground sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p>Independent Grok model guide and OpenRouter-powered text interface.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/">Grok Build</Link>
            <Link href="/pricing">Pricing</Link>
            <a href="https://openrouter.ai/x-ai" target="_blank" rel="noreferrer">OpenRouter xAI directory</a>
          </div>
        </div>
      </footer>
    </>
  );
}
