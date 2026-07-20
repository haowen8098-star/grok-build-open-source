export type BlogArticle = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
  cover: string;
  coverAlt: string;
  compactSummary: string;
  keyTakeaways: string[];
  sidebarLinks: { label: string; href: string }[];
  carousel: never[];
  newsletter: { enabled: boolean; reason: string };
  inlineConversionModules: {
    kind: "guide";
    target: string;
    placementPercent: number;
    afterHeading: string;
    prompt: string;
    title: string;
    image: { src: string; alt: string };
    cta: string;
    visibleFieldsContract: string;
  }[];
  inlineMediaPlacementBrief: string;
  authorityLinks: { label: string; href: string; reason: string }[];
  faqs: { question: string; answer: string }[];
};

export const blogArticles: BlogArticle[] = [
  {
    slug: "what-is-an-ai-agent-framework",
    title: "What Is an AI Agent Framework? A Practical Architecture Guide for Developers",
    metaTitle: "What Is an AI Agent Framework? Developer Architecture Guide",
    metaDescription:
      "Learn how AI agent frameworks coordinate context, tools, state, and review—and how they differ from LLMs, chat apps, and coding-agent harnesses.",
    publishedAt: "2026-07-20",
    updatedAt: "2026-07-20",
    cover: "/opengraph-image",
    coverAlt: "Grok Build source-backed coding-agent guide",
    compactSummary:
      "An AI agent framework is the operating layer around a model: it manages context, tool permissions, state, execution, and review. For developers, the important question is not which framework sounds most autonomous, but which boundaries stay inspectable when it touches real code and systems.",
    keyTakeaways: [
      "A framework is not the model. It supplies the loop that lets a model act with context, tools, state, and policies.",
      "A coding-agent harness is a focused implementation surface for repository work; it can use framework patterns without being the same thing as a general-purpose framework.",
      "For code work, least-privilege tools, explicit approval, source provenance, tests, and diff review matter more than a long feature list.",
    ],
    sidebarLinks: [
      { label: "The short definition", href: "#definition" },
      { label: "Framework vs. model vs. harness", href: "#boundaries" },
      { label: "The operating loop", href: "#operating-loop" },
      { label: "Safe coding workflow", href: "#coding-workflow" },
      { label: "Selection checklist", href: "#selection-checklist" },
      { label: "FAQ", href: "#faq" },
    ],
    carousel: [],
    newsletter: {
      enabled: false,
      reason: "Grok Building does not currently expose a public newsletter subscription surface.",
    },
    inlineConversionModules: [
      {
        kind: "guide",
        target: "/",
        placementPercent: 22,
        afterHeading: "The operating loop",
        prompt: "Want a concrete, source-backed coding-agent harness to inspect?",
        title: "Explore the Grok Build guide",
        image: {
          src: "/opengraph-image",
          alt: "Grok Build source-backed coding-agent guide",
        },
        cta: "Open the source guide",
        visibleFieldsContract:
          "image_card=true; show image, type label, Recommended next, natural prompt, title, and one CTA only.",
      },
    ],
    inlineMediaPlacementBrief:
      "No decorative inline media is required. Use one existing Grok Building guide card after the operating-loop section; it is semantically tied to the product bridge, not a detail-page hero. Do not generate images for this article.",
    authorityLinks: [
      {
        label: "xAI open-source announcement",
        href: "https://x.ai/open-source",
        reason: "First-party source for Grok Build open-source and source-build claims.",
      },
      {
        label: "xai-org/grok-build repository",
        href: "https://github.com/xai-org/grok-build",
        reason: "First-party repository for source, license, and current implementation evidence.",
      },
      {
        label: "Grok Build documentation",
        href: "https://docs.x.ai/build/overview",
        reason: "First-party setup and runtime reference.",
      },
    ],
    faqs: [
      {
        question: "Is an AI agent framework the same as an LLM?",
        answer:
          "No. An LLM generates or ranks tokens. An agent framework supplies the operating loop around that model: state, tool interfaces, policies, retries, evaluation, and handoffs. A model can be useful without a framework, but it cannot by itself define safe execution boundaries for a multi-step system.",
      },
      {
        question: "Is a coding-agent harness the same as an agent framework?",
        answer:
          "Not exactly. A coding-agent harness is a developer-facing runtime for repository work. It usually applies framework ideas—context, tools, execution, observation, and review—but narrows them to code, terminals, tests, diffs, and project instructions.",
      },
      {
        question: "Do I need a framework for every AI feature?",
        answer:
          "No. A single prompt-and-response feature may only need a model call and ordinary application controls. A framework becomes useful when work spans multiple steps, tools, state, or approval rules and you need those boundaries to be repeatable and observable.",
      },
      {
        question: "What is the first safety control for an agent that can touch code?",
        answer:
          "Start with a narrowly scoped repository and an explicit tool allowlist. Keep credentials out of prompts, require review before consequential commands, and treat test output and diffs as the evidence for a change—not the model's confidence.",
      },
    ],
  },
];

export function getBlogArticle(slug: string) {
  return blogArticles.find((article) => article.slug === slug);
}
