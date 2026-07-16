import type { ProviderPreview, SourceLink } from "@/lib/types";

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const siteConfig = {
  name: "Grok Building",
  shortName: "Grok Building",
  description:
    "A source-backed guide to Grok Build open source with a live, switchable xAI model console powered securely through OpenRouter.",
  url: (configuredUrl || "https://www.grokbuilding.com").replace(/\/$/, ""),
  githubUrl: "https://github.com/xai-org/grok-build",
  installUrl: "https://x.ai/cli",
  openSourceUrl: "https://x.ai/open-source",
  lastVerified: "July 16, 2026",
  navItems: [
    { label: "Try Grok", href: "/#try-grok" },
    { label: "Overview", href: "/#overview" },
    { label: "Why Open Source", href: "/#why-open-source" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Build from Source", href: "/#build-from-source" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/#faq" },
  ],
} as const;

export const openRouterProvider: ProviderPreview = {
  name: "OpenRouter xAI",
  modelSlug: "x-ai/grok-build-0.1",
  directoryUrl: "https://openrouter.ai/x-ai",
  status: "live",
};

export const sourceLinks: SourceLink[] = [
  {
    title: "Grok Build is open source",
    href: "https://x.ai/open-source",
    description: "xAI’s official open-source announcement and source-build commands.",
    kind: "official",
  },
  {
    title: "xai-org/grok-build",
    href: "https://github.com/xai-org/grok-build",
    description: "The public Rust repository, README, license, and source tree.",
    kind: "official",
  },
  {
    title: "Grok Build CLI",
    href: "https://x.ai/news/grok-build-cli",
    description: "Launch overview covering tools, agents, worktrees, and automation.",
    kind: "official",
  },
  {
    title: "Grok Build documentation",
    href: "https://docs.x.ai/build/overview",
    description: "Official setup and runtime-mode documentation.",
    kind: "official",
  },
  {
    title: "Contribution policy",
    href: "https://github.com/xai-org/grok-build/blob/main/CONTRIBUTING.md",
    description: "The repository’s current policy on external contributions.",
    kind: "official",
  },
  {
    title: "OpenRouter API quickstart",
    href: "https://openrouter.ai/docs/quickstart",
    description: "Official chat-completion, streaming, and app-attribution guidance.",
    kind: "official",
  },
  {
    title: "OpenRouter authentication",
    href: "https://openrouter.ai/docs/api_reference/authentication",
    description: "Bearer-token handling and server-side credential guidance.",
    kind: "official",
  },
  {
    title: "Kilo model reference",
    href: "https://kilo.ai/models/x-ai-grok-build-0-1",
    description: "A third-party reference for the separately hosted Grok Build 0.1 model.",
    kind: "reference",
  },
];
