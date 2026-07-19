import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Code2,
  Eye,
  GitFork,
  GitPullRequest,
  Layers3,
  LockKeyhole,
  PackageOpen,
  ScanSearch,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { ArchitectureFlow } from "@/components/architecture-flow";
import { CapabilityGrid } from "@/components/capability-grid";
import { CopyCommand } from "@/components/copy-command";
import { GrokConsole } from "@/components/grok-console";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { SourceCard } from "@/components/source-card";
import { TerminalWindow } from "@/components/terminal-window";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { audiences, buildCommands, faqs } from "@/lib/content";
import { openRouterProvider, siteConfig, sourceLinks } from "@/lib/site-config";

const verificationPoints = [
  {
    icon: ScanSearch,
    title: "Inspectable",
    description: "Read the agent harness instead of inferring behavior from a closed interface.",
  },
  {
    icon: PackageOpen,
    title: "Buildable",
    description: "Compile and validate the first-party Rust source in your own environment.",
  },
  {
    icon: Layers3,
    title: "Extensible",
    description: "Trace where skills, hooks, MCP servers, tools, and model configuration connect.",
  },
  {
    icon: ShieldCheck,
    title: "Bounded",
    description: "Review the license and contribution policy before treating public source as a community project.",
  },
];

const modelDecisionGuide = [
  {
    model: "Grok Build 0.1",
    use: "Start here for code generation, debugging, repository planning, and questions about agent workflows.",
    tradeoff: "Focused coding option with the lowest current xAI input and output rates in the live catalog.",
  },
  {
    model: "Grok 4.5",
    use: "Use for difficult architecture decisions, deeper reasoning, or code review where answer quality matters more than price.",
    tradeoff: "Higher current output cost than Grok Build 0.1; keep the prompt focused.",
  },
  {
    model: "Grok 4.3",
    use: "Useful for long specifications, broad repository context, and comparisons that need more source material in one request.",
    tradeoff: "A larger context window does not remove the need to trim irrelevant logs and generated files.",
  },
  {
    model: "Grok 4.20 / Multi-Agent",
    use: "Evaluate for very long inputs, decomposed analysis, and tasks that benefit from exploring several solution paths.",
    tradeoff: "Long-context requests can still become expensive; confirm the live model price before sending.",
  },
];

const requestLifecycle = [
  {
    title: "Load repository instructions",
    detail:
      "The harness begins with repository context such as AGENTS.md, working-tree state, and the developer’s request. Good instructions define scope, commands, and files that must not change.",
  },
  {
    title: "Plan the task",
    detail:
      "The agent converts the request into a sequence of inspect, edit, and verification steps. A useful plan names the acceptance criteria instead of only describing the desired appearance.",
  },
  {
    title: "Invoke tools and MCP",
    detail:
      "File reads, shell commands, external tools, and MCP servers provide evidence or perform bounded actions. Permissions should match the task and high-impact actions should remain reviewable.",
  },
  {
    title: "Ask the configured model",
    detail:
      "The model receives selected context and tool results, then proposes the next action or response. Changing the model affects reasoning, context capacity, latency, and cost—not the repository license.",
  },
  {
    title: "Review and approve",
    detail:
      "The terminal, headless runner, or ACP client returns changes and results to the developer. Treat tests, diffs, and command output as the final evidence, not the model’s confidence.",
  },
];

const adoptionChecklist = [
  "Confirm which source files, network calls, and telemetry paths exist in the version you plan to deploy.",
  "Define whether the agent may edit files, execute commands, access secrets, or call external MCP servers.",
  "Set provider credit limits and rate limits before exposing a shared chat or automated workflow.",
  "Review the Apache-2.0 scope, third-party dependencies, and the repository’s closed contribution policy.",
  "Choose an update process because the public repository is periodically synced from an internal monorepo.",
];

const promptTemplate =
  "Goal: [what must be true when the task is finished]\n" +
  "Context: [language, framework, relevant files, current behavior]\n" +
  "Constraints: [what must not change, security, performance, compatibility]\n" +
  "Evidence: [error message, code excerpt, logs, or reproduction steps]\n" +
  "Output: [patch, explanation, test plan, or decision memo]";

const schema = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en-US",
  },
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Grok Build Open Source: Source Code, Setup, and How It Works",
    description: siteConfig.description,
    dateModified: "2026-07-16",
    mainEntityOfPage: siteConfig.url,
    image: siteConfig.url + "/opengraph-image",
    inLanguage: "en-US",
    author: {
      "@type": "Organization",
      name: "Grok Building",
    },
    publisher: {
      "@type": "Organization",
      name: "Grok Building",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: "Grok Build",
    description: "xAI’s public coding-agent harness and command-line interface.",
    codeRepository: siteConfig.githubUrl,
    programmingLanguage: "Rust",
    runtimePlatform: "Command line",
    license: "https://www.apache.org/licenses/LICENSE-2.0",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
];

export default function Home() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section id="top" className="site-grid relative overflow-hidden border-b border-border">
          <div className="hero-glow" aria-hidden="true" />
          <div className="mx-auto grid min-h-[760px] w-full min-w-0 max-w-[1440px] grid-cols-[minmax(0,1fr)] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20 lg:py-28">
            <div className="relative z-10 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="status-label">
                  <span className="size-1.5 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.7)]" />
                  Open source
                </span>
                {["Rust", "Apache-2.0", "CLI / TUI / ACP"].map((item) => (
                  <span key={item} className="tech-label">
                    {item}
                  </span>
                ))}
              </div>

              <h1 className="mt-8 max-w-4xl break-words text-pretty text-[42px] font-medium leading-[1.01] tracking-[-0.05em] text-foreground sm:text-6xl sm:leading-[0.98] lg:text-[76px]">
                Grok Build Open Source:
                <span className="mt-2 block text-muted-foreground">
                  Source Code, Setup, and How It Works
                </span>
              </h1>
              <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                A source-backed field guide to the public Grok Build coding-agent
                harness—what is open, how to build it, where models fit, and what
                developers should verify before adopting it.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
                    <GitFork className="size-4" />
                    View source on GitHub
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={siteConfig.installUrl} target="_blank" rel="noreferrer">
                    <Terminal className="size-4" />
                    Install Grok Build
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>

              <a
                href="#overview"
                className="mt-12 inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Read the guide
                <ArrowDown className="size-3.5" />
              </a>
            </div>

            <div className="relative z-10 min-w-0 lg:pl-4">
              <div className="terminal-backdrop" aria-hidden="true" />
              <TerminalWindow />
            </div>
          </div>
        </section>

        <aside className="border-b border-border bg-surface/35" aria-label="Latest update">
          <div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-5 sm:px-8 md:grid-cols-[160px_1fr_auto] md:items-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
              Latest update
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              xAI’s official open-source page now links the public Grok Build repository and local source-build commands.
            </p>
            <a
              href={siteConfig.openSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-foreground hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Verify at xAI
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </aside>

        <section id="try-grok" className="grok-playground-zone border-b border-border bg-[#030303]">
          <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
            <div className="border border-border bg-[#070707] p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center border border-accent/50 bg-accent/10 text-accent">
                    <CircleDot className="size-3.5" />
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground">
                    Live model console
                  </p>
                </div>
                <a
                  href="https://openrouter.ai/x-ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  xAI models via OpenRouter
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
              <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                <div>
                  <p className="section-eyebrow">Interactive workspace</p>
                  <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-foreground sm:text-5xl">
                    Ask Grok. Know the model, limit, and cost before you send.
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
                    Ask coding questions with three free guest questions on Grok Build
                    0.1. Your remaining questions and credit balance stay visible
                    while you work.
                  </p>
                </div>
                <div className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-4">
                  {[
                    ["Provider", "OpenRouter"],
                    ["Default", "Grok Build 0.1"],
                    ["Guest access", "3 questions"],
                    ["Usage", "Credits + free access"],
                  ].map(([label, value]) => (
                    <div className="border-b border-r border-border bg-[#0b0b0b] p-4" key={label}>
                      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 border-t-2 border-accent pt-4">
                <GrokConsole />
              </div>
            </div>

            <div className="mt-20 grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <p className="section-eyebrow">Model selection</p>
                <h3 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-3xl">
                  Choose by task, not by the largest model number.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Start with Grok Build 0.1 for ordinary coding work. Move to a
                  broader or stronger model when the task actually needs more
                  context or reasoning. The selector above is the source of truth
                  for current context length and token prices.
                </p>
              </div>
              <div className="border-t border-border">
                {modelDecisionGuide.map((item, index) => (
                  <article
                    key={item.model}
                    className="grid gap-3 border-b border-border py-6 sm:grid-cols-[52px_0.65fr_1.35fr]"
                  >
                    <span className="text-[10px] font-semibold tabular-nums tracking-[0.1em] text-accent">
                      0{index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{item.model}</h4>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {item.tradeoff}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{item.use}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-16 grid border border-border bg-surface/35 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="border-b border-border p-6 lg:border-b-0 lg:border-r sm:p-8">
                <p className="section-eyebrow">Prompt recipe</p>
                <h3 className="mt-4 text-xl font-medium tracking-[-0.02em]">
                  Give the model a testable target.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  “Fix this” forces the model to guess. A useful coding prompt
                  names the finish line, the relevant environment, constraints,
                  observable evidence, and the output you expect. Paste only the
                  smallest code or log excerpt needed to make the problem concrete.
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                    reusable / task brief
                  </span>
                  <CopyCommand command={promptTemplate} label="Copy prompt template" />
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-xs leading-7 text-foreground sm:p-8">
                  <code>{promptTemplate}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section id="overview" className="section-shell">
          <div className="section-index">
            <span>01</span>
            <span>Overview</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="What is Grok Build?"
              title="An agent harness and terminal interface—not just a model name."
              description="Grok Build coordinates repository context, tools, model reasoning, edits, review, and approval. Its public source covers the coding-agent harness and CLI surface."
            />

            <div className="mt-12 grid border-l border-t border-border lg:grid-cols-2">
              <article className="border-b border-r border-border bg-surface/50 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <Code2 className="size-5 text-accent" strokeWidth={1.5} />
                  <span className="status-label">Open-source layer</span>
                </div>
                <h3 className="mt-16 text-2xl font-medium tracking-[-0.03em]">
                  Grok Build
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  The public Rust repository contains the agent runtime, CLI, and
                  full-screen terminal UI. This is the code you can inspect and
                  build locally.
                </p>
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-foreground hover:text-accent"
                >
                  Browse the repository
                  <ArrowRight className="size-3.5" />
                </a>
              </article>

              <article className="border-b border-r border-border bg-background p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <CircleDot className="size-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="tech-label">Hosted model layer</span>
                </div>
                <h3 className="mt-16 text-2xl font-medium tracking-[-0.03em]">
                  Grok Build 0.1
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
                  A separately listed hosted model. Model access and pricing are
                  provider concerns; they are not the same as the open-source CLI
                  repository or its license.
                </p>
                <a
                  href={openRouterProvider.directoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-foreground hover:text-accent"
                >
                  Live provider: {openRouterProvider.name}
                  <ArrowUpRight className="size-3.5" />
                </a>
              </article>
            </div>

            <div className="mt-5 border border-border bg-surface/30 px-5 py-4">
              <p className="flex gap-3 text-xs leading-6 text-muted-foreground">
                <LockKeyhole className="mt-1 size-3.5 shrink-0 text-accent" />
                Model requests use a server-side OpenRouter proxy. The provider
                key never ships to the browser. Supabase handles email sessions,
                free-question limits, and the credit ledger; payment checkout is
                intentionally not enabled yet.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              <article>
                <p className="section-eyebrow">What you can inspect</p>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  The public repository lets you examine how the terminal,
                  agent runtime, configuration, tools, and extension surfaces
                  are implemented. You can compile that code locally, review
                  dependency choices, and compare a release with your own fork.
                </p>
              </article>
              <article>
                <p className="section-eyebrow">What remains hosted</p>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Model inference still runs on a provider’s infrastructure.
                  Model weights, provider retention, availability, latency, and
                  token charges are separate from the CLI’s source license.
                  Open-source client code does not make hosted inference free.
                </p>
              </article>
              <article>
                <p className="section-eyebrow">What OpenRouter adds</p>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  OpenRouter provides one normalized API and a live model
                  directory. This site uses it as a gateway, while restricting
                  requests to xAI model IDs and keeping the credential on the
                  server. Switching models changes inference, not the harness.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="why-open-source" className="section-shell">
          <div className="section-index">
            <span>02</span>
            <span>Why open source</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="Why it matters"
              title="Source turns agent behavior into something developers can examine."
              description="The practical value is not a slogan. It is the ability to trace code paths, reproduce builds, understand extension points, and evaluate the project’s actual boundaries."
            />
            <div className="mt-10 grid border-l border-t border-border sm:grid-cols-2">
              {verificationPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <article
                    key={point.title}
                    className="border-b border-r border-border p-6 sm:min-h-56 sm:p-8"
                  >
                    <Icon className="size-5 text-accent" strokeWidth={1.5} />
                    <h3 className="mt-12 text-lg font-medium">{point.title}</h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                      {point.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-16 grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <p className="section-eyebrow">Adoption checklist</p>
                <h3 className="mt-4 text-2xl font-medium tracking-[-0.03em]">
                  Inspect the operational boundary before giving an agent access.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Reading source is the beginning of due diligence, not the end.
                  Your deployment policy must also cover data, command execution,
                  provider spend, updates, and any external tool the agent can call.
                </p>
              </div>
              <ol className="border-t border-border">
                {adoptionChecklist.map((item, index) => (
                  <li
                    key={item}
                    className="grid gap-3 border-b border-border py-5 sm:grid-cols-[54px_1fr]"
                  >
                    <span className="text-[10px] font-semibold tabular-nums tracking-[0.1em] text-accent">
                      0{index + 1}
                    </span>
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="section-shell">
          <div className="section-index">
            <span>03</span>
            <span>How it works</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="System map"
              title="Five layers connect source code to an approved change."
              description="The harness loads repository context, coordinates an agent runtime, invokes tools, calls a configured model, and returns control to the developer through the terminal."
            />
            <ArchitectureFlow />

            <div className="mt-12 border-t border-border">
              {requestLifecycle.map((step, index) => (
                <article
                  key={step.title}
                  className="grid gap-4 border-b border-border py-6 sm:grid-cols-[70px_0.55fr_1.45fr]"
                >
                  <span className="text-[10px] font-semibold tabular-nums tracking-[0.1em] text-accent">
                    0{index + 1}
                  </span>
                  <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground">{step.detail}</p>
                </article>
              ))}
            </div>

            <div className="mt-20">
              <SectionHeading
                eyebrow="Capabilities"
                title="Built for programmable coding workflows."
                description="Official materials describe repository instructions, extension surfaces, parallel work, and several ways to run the agent."
              />
              <CapabilityGrid />
            </div>
          </div>
        </section>

        <section id="build-from-source" className="section-shell">
          <div className="section-index">
            <span>04</span>
            <span>Build from source</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="Local setup"
              title="Clone the repository. Build the Rust workspace. Verify before use."
              description="These commands follow the public xAI open-source page. Check the repository README for prerequisites and changes before running them."
            />

            <div className="mt-10 grid border-l border-t border-border sm:grid-cols-3">
              {[
                [
                  "Toolchain",
                  "Install Git plus a Rust toolchain that provides cargo, rustc, Clippy, and rustfmt. Follow the repository when it pins a specific version.",
                ],
                [
                  "Workspace",
                  "Use a clean local directory and inspect the README, license, workspace manifest, and build scripts before executing project commands.",
                ],
                [
                  "Credentials",
                  "Keep provider keys in local environment files or a secret manager. Never commit them to a fork, example config, terminal transcript, or issue.",
                ],
              ].map(([title, detail], index) => (
                <article className="border-b border-r border-border p-5 sm:p-6" key={title}>
                  <span className="text-[10px] font-semibold tabular-nums tracking-[0.1em] text-accent">
                    0{index + 1}
                  </span>
                  <h3 className="mt-8 text-sm font-medium text-foreground">{title}</h3>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">{detail}</p>
                </article>
              ))}
            </div>

            <div className="mt-10 border border-border bg-surface/45">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  00 / clone
                </span>
                <CopyCommand command={"git clone https://github.com/xai-org/grok-build\ncd grok-build"} />
              </div>
              <pre className="overflow-x-auto px-4 py-5 font-mono text-xs leading-7 sm:px-5">
                <code className="whitespace-nowrap">
                  <span className="mr-3 text-accent">$</span>
                  git clone https://github.com/xai-org/grok-build{"\n"}
                  <span className="mr-3 text-accent">$</span>
                  cd grok-build
                </code>
              </pre>
            </div>

            <Tabs defaultValue="build" className="mt-5">
              <TabsList aria-label="Source commands">
                <TabsTrigger value="build">Build / validate</TabsTrigger>
                <TabsTrigger value="quality">Lint / format</TabsTrigger>
              </TabsList>
              <TabsContent value="build">
                <CommandTable commands={buildCommands.build} />
              </TabsContent>
              <TabsContent value="quality">
                <CommandTable commands={buildCommands.quality} />
              </TabsContent>
            </Tabs>

            <div className="mt-10 grid gap-8 lg:grid-cols-[0.65fr_1.35fr]">
              <div>
                <p className="section-eyebrow">Verification</p>
                <h3 className="mt-4 text-xl font-medium tracking-[-0.02em]">
                  A successful compile is not the whole acceptance test.
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "cargo check exits successfully for the documented workspace target.",
                  "Clippy findings are reviewed rather than suppressed without explanation.",
                  "cargo fmt --all produces no unexpected source changes.",
                  "The launched TUI can load a test repository without receiving production secrets.",
                ].map((item) => (
                  <p
                    key={item}
                    className="flex gap-3 border-l border-border pl-4 text-sm leading-6 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-1 size-3.5 shrink-0 text-success" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-4 border-l-2 border-accent bg-accent/[0.045] p-5 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Prefer a prebuilt release? Use xAI’s installer. Building from
                source is useful when you need to inspect the implementation or
                validate a local toolchain.
              </p>
              <Button asChild variant="outline" className="shrink-0">
                <a href={siteConfig.installUrl} target="_blank" rel="noreferrer">
                  Official installer
                  <ArrowUpRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section id="who-its-for" className="section-shell">
          <div className="section-index">
            <span>05</span>
            <span>Who it’s for</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="Audience"
              title="Useful when you care about the harness—not only the output."
              description="Grok Build’s public source is most relevant to people evaluating terminal workflows, extension architecture, and operational control."
            />
            <div className="mt-10 border-t border-border">
              {audiences.map((audience, index) => (
                <article
                  key={audience.role}
                  className="group grid gap-4 border-b border-border py-6 sm:grid-cols-[70px_0.7fr_1.3fr] sm:items-center"
                >
                  <span className="text-[10px] font-semibold tabular-nums tracking-[0.1em] text-muted-foreground">
                    0{index + 1}
                  </span>
                  <h3 className="text-base font-medium text-foreground transition-colors group-hover:text-accent">
                    {audience.role}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">{audience.outcome}</p>
                </article>
              ))}
            </div>

            <div className="mt-14 grid border-l border-t border-border md:grid-cols-2">
              <article className="border-b border-r border-border bg-surface/35 p-6 sm:p-8">
                <p className="section-eyebrow">Strong fit</p>
                <h3 className="mt-4 text-xl font-medium tracking-[-0.02em]">
                  You want inspectable automation with a developer in control.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Grok Build is worth evaluating when your team already uses Git,
                  terminal tooling, automated checks, and explicit approval
                  boundaries. It is especially relevant when the ability to
                  inspect or fork the harness matters to procurement or security.
                </p>
              </article>
              <article className="border-b border-r border-border p-6 sm:p-8">
                <p className="section-eyebrow">Reconsider</p>
                <h3 className="mt-4 text-xl font-medium tracking-[-0.02em]">
                  You need a managed, no-code product with formal support.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  The public repository currently does not accept contributions.
                  Teams that require an upstream customization path, guaranteed
                  support, centrally managed user accounts, or a zero-terminal
                  workflow should verify those needs before standardizing on it.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="boundaries" className="section-shell">
          <div className="section-index">
            <span>06</span>
            <span>Boundaries</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="Read before adopting"
              title="Public source does not automatically mean a community-governed project."
              description="The repository is useful for transparency and local builds, but its license, sync model, and contribution policy should be read together."
            />
            <div className="mt-10 grid border-l border-t border-border md:grid-cols-3">
              <BoundaryCard
                icon={ShieldCheck}
                label="License"
                title="Apache-2.0"
                text="The repository identifies first-party source as Apache-2.0 licensed. Review dependency licenses and notices separately before redistribution."
              />
              <BoundaryCard
                icon={GitPullRequest}
                label="Contribution"
                title="External PRs closed"
                text="The current guide says unsolicited patches and pull requests are not accepted. A fork can diverge without an upstream merge path."
              />
              <BoundaryCard
                icon={Eye}
                label="Source flow"
                title="Public mirror"
                text="The public repository says it is periodically synced from an internal monorepo. Public commit timing may not match internal development."
              />
            </div>
            <a
              href="https://github.com/xai-org/grok-build/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-foreground hover:text-accent"
            >
              Read the official contribution policy
              <ArrowUpRight className="size-3.5" />
            </a>

            <div className="mt-14 border-l-2 border-accent bg-accent/[0.035] p-6 sm:p-8">
              <p className="section-eyebrow">Practical boundary</p>
              <h3 className="mt-4 text-xl font-medium tracking-[-0.02em]">
                Audit the version you deploy, not the project’s reputation.
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                An open repository answers “what code was published?” It does not
                automatically answer which binary a hosted service runs, how model
                providers retain prompts, which optional integrations are enabled,
                or how quickly a security fix reaches your environment. Pin a
                reviewed commit, record configuration, protect credentials, and
                repeat verification when you update.
              </p>
            </div>
          </div>
        </section>

        <section id="sources" className="section-shell">
          <div className="section-index">
            <span>07</span>
            <span>Sources</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="Verification trail"
              title="Primary links behind this guide."
              description={"Last verified " + siteConfig.lastVerified + ". Recheck official documentation before making production or security decisions."}
            />
            <div className="mt-10 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {sourceLinks.map((source, index) => (
                <SourceCard source={source} index={index} key={source.href} />
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="section-shell">
          <div className="section-index">
            <span>08</span>
            <span>Q&amp;A</span>
          </div>
          <div className="section-content">
            <SectionHeading
              eyebrow="Detailed Q&A"
              title="Questions to answer before you build, pay, or paste code."
              description="These answers connect the open-source repository, hosted xAI models, OpenRouter billing, this site’s security boundary, and the operational choices a real user must make."
            />
            <Accordion type="single" collapsible className="mt-10 border-t border-border">
              {faqs.map((faq, index) => (
                <AccordionItem value={"faq-" + index} key={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/30">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
              Grok Build / Open Source Guide
            </p>
            <p className="mt-4 max-w-xl text-xs leading-6 text-muted-foreground">
              An independent, unofficial guide. Not affiliated with or endorsed by
              xAI. Grok and Grok Build are trademarks of their respective owner.
              Model responses are routed through OpenRouter.
            </p>
          </div>
          <div className="flex flex-col items-start gap-6 md:items-end">
            <a
              href="https://launchdaily.info/products/grok-build?ref=launchdaily_badge"
              target="_blank"
              rel="noopener"
            >
              <img
                src="https://launchdaily.info/badge/grok-build"
                alt="Featured on LaunchDaily"
                width={200}
                height={54}
              />
            </a>
            <a
              href="https://www.listbulb.com/tools/grokbuilding"
              target="_blank"
              rel="noopener"
            >
              <img
                src="https://www.listbulb.com/featured-on-listbulb-light.svg"
                alt="Featured on ListBulb"
                height={240}
                className="h-auto w-48 max-w-full"
              />
            </a>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <a className="hover:text-foreground" href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a className="hover:text-foreground" href={siteConfig.openSourceUrl} target="_blank" rel="noreferrer">
                xAI source page
              </a>
              <a
                className="hover:text-foreground"
                href="https://aitoolbox.fyi"
                target="_blank"
                rel="noopener"
              >
                AI Toolbox
              </a>
              <a
                className="hover:text-foreground"
                href="https://whatisaitools.com/"
                title="What Is Ai Tools"
              >
                What Is Ai Tools
              </a>
              <a
                className="hover:text-foreground"
                href="https://SeekAIs.com/"
                title="SeekAIs"
              >
                SeekAIs - AI Tools Directory
              </a>
              <a className="hover:text-foreground" href="#top">
                Back to top
              </a>
            </div>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}

function CommandTable({
  commands,
}: {
  commands: Array<{ label: string; command: string; note: string }>;
}) {
  return (
    <div className="border border-border bg-surface/45">
      {commands.map((item, index) => (
        <div
          key={item.command}
          className="grid grid-cols-[70px_1fr_auto] items-center gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[100px_1fr_auto] sm:px-5"
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            0{index + 1} / {item.label}
          </span>
          <div className="min-w-0 overflow-x-auto font-mono text-xs scrollbar-none">
            <code className="whitespace-nowrap text-foreground">{item.command}</code>
            <span className="ml-4 whitespace-nowrap text-muted-foreground">{item.note}</span>
          </div>
          <CopyCommand command={item.command} />
        </div>
      ))}
    </div>
  );
}

function BoundaryCard({
  icon: Icon,
  label,
  title,
  text,
}: {
  icon: typeof CheckCircle2;
  label: string;
  title: string;
  text: string;
}) {
  return (
    <article className="min-h-60 border-b border-r border-border bg-surface/40 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <Icon className="size-5 text-accent" strokeWidth={1.5} />
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
      </div>
      <h3 className="mt-14 text-xl font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}
