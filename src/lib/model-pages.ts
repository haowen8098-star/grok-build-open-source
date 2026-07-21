export type ModelPageConfig = {
  slug: string;
  modelId: string;
  name: string;
  title: string;
  metaTitle: string;
  description: string;
  summary: string;
  searchIntent: string;
  useCases: readonly {
    title: string;
    description: string;
  }[];
  limitations: readonly string[];
  starterPrompts: readonly string[];
  faqs: readonly {
    question: string;
    answer: string;
  }[];
  sources: readonly {
    label: string;
    href: string;
    reason: string;
  }[];
};

export const modelPageConfigs: readonly ModelPageConfig[] = [
  {
    slug: "grok-4-5",
    modelId: "x-ai/grok-4.5",
    name: "Grok 4.5",
    title: "Use Grok 4.5 for demanding code and reasoning work",
    metaTitle: "Grok 4.5 Online Console, Pricing & Context",
    description:
      "Try Grok 4.5 in a model-locked text console. Check live OpenRouter pricing, context, practical coding uses, limits, and comparisons.",
    summary:
      "Grok 4.5 is xAI’s current flagship model for coding, reasoning, and general tasks. This page keeps every request on the exact Grok 4.5 route so you can evaluate it without an automatic model swap.",
    searchIntent: "Grok 4.5 model facts and an exact-model online console",
    useCases: [
      {
        title: "Architecture decisions",
        description:
          "Compare system boundaries, migration paths, and operational tradeoffs when the answer needs more than a quick code completion.",
      },
      {
        title: "Complex refactors",
        description:
          "Turn a bounded code excerpt and constraints into a staged refactor plan with explicit checks and rollback points.",
      },
      {
        title: "High-stakes review",
        description:
          "Ask for correctness, security, and failure-mode analysis when review depth matters more than minimizing model cost.",
      },
    ],
    limitations: [
      "This Console sends text chat only. It does not expose file upload, Web or X Search, MCP, or tool execution.",
      "A conversation is capped at 100,000 characters and a response at 4,096 tokens, so this interface does not expose the model’s full provider context window.",
      "Advanced models require a signed-in account with credits. Price, context, and route availability are read from the current model directory.",
    ],
    starterPrompts: [
      "Review this service architecture and identify the three highest-risk failure modes.",
      "Design a staged refactor plan for a large TypeScript module without changing its public API.",
      "Compare two database migration strategies and define rollback checks for each.",
      "Audit this function for correctness, security, and performance issues.",
    ],
    faqs: [
      {
        question: "What is Grok 4.5 best used for?",
        answer:
          "Grok 4.5 is a strong fit for demanding coding, architecture, review, and general reasoning tasks. Give it a bounded problem, concrete constraints, and a testable output rather than an entire unfiltered repository.",
      },
      {
        question: "Does this page always use Grok 4.5?",
        answer:
          "Yes. The Console is locked to the x-ai/grok-4.5 route. A saved model choice cannot replace it, and sending is disabled if that route is absent from the current live catalog.",
      },
      {
        question: "Can I upload files or use Grok search here?",
        answer:
          "No. This independent Console currently sends text chat only. It does not provide file upload, Web or X Search, MCP, or other tool execution.",
      },
      {
        question: "Is Grok Building an official xAI product?",
        answer:
          "No. Grok Building is an independent developer interface and guide. Model requests are routed through OpenRouter; official model documentation remains the source of truth for xAI capabilities.",
      },
    ],
    sources: [
      {
        label: "xAI model documentation",
        href: "https://docs.x.ai/developers/models",
        reason: "Official model positioning and published specifications.",
      },
      {
        label: "OpenRouter xAI directory",
        href: "https://openrouter.ai/x-ai",
        reason: "Current route availability, provider context, and token pricing.",
      },
    ],
  },
  {
    slug: "grok-4-20",
    modelId: "x-ai/grok-4.20",
    name: "Grok 4.20",
    title: "Use Grok 4.20 for complex analysis and long specifications",
    metaTitle: "Grok 4.20 Online Console, Pricing & Context",
    description:
      "Try standard Grok 4.20 in a locked text console. See live OpenRouter pricing, context, practical uses, limits, and model comparisons.",
    summary:
      "This page uses the standard x-ai/grok-4.20 route for complex analysis, long specifications, and solution comparison. It is not the separate Grok 4.20 Multi-Agent route.",
    searchIntent: "Standard Grok 4.20 facts and an exact-model online console",
    useCases: [
      {
        title: "Long-spec analysis",
        description:
          "Extract requirements, conflicts, dependencies, and open questions from a large but deliberately selected specification.",
      },
      {
        title: "Solution comparison",
        description:
          "Evaluate several implementation paths against the same constraints and request a decision table with explicit assumptions.",
      },
      {
        title: "Decomposed reasoning",
        description:
          "Break a complex investigation into verifiable stages while keeping the reasoning inside one standard model conversation.",
      },
    ],
    limitations: [
      "This page calls standard Grok 4.20, not Grok 4.20 Multi-Agent. The two OpenRouter routes are distinct.",
      "This Console sends text chat only. It does not expose file upload, Web or X Search, MCP, or tool execution.",
      "A conversation is capped at 100,000 characters and a response at 4,096 tokens; the full provider context window is not exposed here.",
    ],
    starterPrompts: [
      "Turn this product specification into requirements, dependencies, risks, and open questions.",
      "Compare three architecture options against cost, reliability, complexity, and migration risk.",
      "Decompose this incident into hypotheses and the cheapest test for each one.",
      "Find contradictions in this technical proposal and suggest precise resolutions.",
    ],
    faqs: [
      {
        question: "Is this Grok 4.20 Multi-Agent?",
        answer:
          "No. This page is locked to the standard x-ai/grok-4.20 route. The Multi-Agent version is a separate route and is not silently substituted here.",
      },
      {
        question: "What is Grok 4.20 useful for?",
        answer:
          "It is useful for complex analysis, long specifications, and comparing multiple solution paths. In this Console, inputs still need to fit the site’s 100,000-character request limit.",
      },
      {
        question: "Will the Console switch models if Grok 4.20 is unavailable?",
        answer:
          "No. The model is locked. If the exact route disappears from the live catalog, sending is disabled and the page reports that it is currently unavailable.",
      },
      {
        question: "Is this an official xAI interface?",
        answer:
          "No. Grok Building is an independent developer interface using OpenRouter for model access. xAI and OpenRouter documentation remain the authoritative sources for model and route details.",
      },
    ],
    sources: [
      {
        label: "xAI model documentation",
        href: "https://docs.x.ai/developers/models",
        reason: "Official model-family documentation and published specifications.",
      },
      {
        label: "OpenRouter xAI directory",
        href: "https://openrouter.ai/x-ai",
        reason: "Current standard and Multi-Agent routes, context, and token pricing.",
      },
    ],
  },
  {
    slug: "grok-4-3",
    modelId: "x-ai/grok-4.3",
    name: "Grok 4.3",
    title: "Use Grok 4.3 for instruction-heavy technical analysis",
    metaTitle: "Grok 4.3 Online Console, Pricing & Context",
    description:
      "Try Grok 4.3 in a model-locked text console. Check live OpenRouter pricing, context, instruction-heavy uses, limits, and comparisons.",
    summary:
      "Grok 4.3 is positioned for reliable instruction following, tool-oriented planning, and detailed analysis. This page locks the Console to its exact OpenRouter route and makes the local interface limits explicit.",
    searchIntent: "Grok 4.3 model facts and an exact-model online console",
    useCases: [
      {
        title: "Instruction-heavy work",
        description:
          "Apply detailed acceptance criteria, output formats, and exclusions to a technical task that needs careful constraint tracking.",
      },
      {
        title: "Tool-scheme planning",
        description:
          "Design tool contracts, permission boundaries, and failure handling without claiming that tools are executed by this Console.",
      },
      {
        title: "Broad specification review",
        description:
          "Analyze selected sections of a long specification and trace how decisions affect downstream components.",
      },
    ],
    limitations: [
      "This Console sends text chat only. It can discuss tool design but cannot execute tools, MCP servers, Web or X Search, or file uploads.",
      "A conversation is capped at 100,000 characters and a response at 4,096 tokens, below the complete provider context capacity.",
      "Advanced models require credits. Live route availability, context, and pricing come from the current OpenRouter-backed model directory.",
    ],
    starterPrompts: [
      "Turn these requirements into a strict implementation checklist with acceptance tests.",
      "Design a tool schema with permission boundaries, validation, and failure handling.",
      "Review this API specification for ambiguous instructions and missing edge cases.",
      "Create a decision record from this technical discussion and preserve every constraint.",
    ],
    faqs: [
      {
        question: "What is Grok 4.3 best suited to?",
        answer:
          "Grok 4.3 is useful for instruction-heavy technical work, tool and schema planning, and detailed analysis of selected specifications. The quality of the result still depends on clear constraints and relevant context.",
      },
      {
        question: "Does this page use the exact Grok 4.3 route?",
        answer:
          "Yes. It is locked to x-ai/grok-4.3. Local storage cannot change the model, and the Console will not substitute a different Grok model if the route is unavailable.",
      },
      {
        question: "Does the large context number mean I can paste the full window here?",
        answer:
          "No. The provider context shown in the live facts describes the route, while this site caps a complete conversation at 100,000 characters and a response at 4,096 tokens.",
      },
      {
        question: "Who operates this Grok 4.3 Console?",
        answer:
          "Grok Building operates this independent developer interface and routes model access through OpenRouter. It is not an official xAI product.",
      },
    ],
    sources: [
      {
        label: "xAI Grok 4.3 documentation",
        href: "https://docs.x.ai/developers/models/grok-4.3",
        reason: "Official Grok 4.3 capabilities and specifications.",
      },
      {
        label: "OpenRouter xAI directory",
        href: "https://openrouter.ai/x-ai",
        reason: "Current route availability, provider context, and token pricing.",
      },
    ],
  },
];

export function getModelPage(slug: string) {
  return modelPageConfigs.find((model) => model.slug === slug);
}
