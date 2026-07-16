import type { FaqItem } from "@/lib/types";

export const buildCommands = {
  build: [
    { label: "Build", command: "cargo run -p xai-grok-pager-bin", note: "# build" },
    { label: "Validate", command: "cargo check -p xai-grok-pager-bin", note: "# validate" },
  ],
  quality: [
    { label: "Lint", command: "cargo clippy -p <crate>", note: "# lint" },
    { label: "Format", command: "cargo fmt --all", note: "# format" },
  ],
};

export const capabilities = [
  {
    index: "01",
    title: "Repository context",
    description:
      "Use AGENTS.md files to carry project-specific instructions through a coding session.",
    tags: ["AGENTS.md", "Context"],
  },
  {
    index: "02",
    title: "Extensible workflows",
    description:
      "Add skills, plugins, hooks, and MCP servers without replacing the core terminal workflow.",
    tags: ["Skills", "Hooks", "MCP"],
  },
  {
    index: "03",
    title: "Parallel execution",
    description:
      "Delegate independent work to subagents and isolate changes with Git worktrees.",
    tags: ["Subagents", "Worktrees"],
  },
  {
    index: "04",
    title: "Multiple surfaces",
    description:
      "Run interactively in the TUI, automate headlessly, or connect through ACP.",
    tags: ["TUI", "Headless", "ACP"],
  },
];

export const audiences = [
  {
    role: "CLI-first developers",
    outcome: "Keep planning, edits, review, and approval inside a keyboard-driven workflow.",
  },
  {
    role: "AI tool builders",
    outcome: "Inspect a real agent harness and study how tools, context, and models connect.",
  },
  {
    role: "Platform teams",
    outcome: "Evaluate extension points before standardizing an agent workflow across repositories.",
  },
  {
    role: "Source auditors",
    outcome: "Build first-party code locally and examine the public Rust implementation.",
  },
  {
    role: "Open-source researchers",
    outcome: "Track the public sync, license boundary, and architecture without relying on a black box.",
  },
];

export const faqs: FaqItem[] = [
  {
    question: "Is Grok Build open source?",
    answer:
      "Yes. xAI’s official open-source page links to the public xai-org/grok-build repository. The repository identifies first-party code as Apache-2.0 licensed and includes the Rust source required for local inspection and builds. Open source here means the published code can be studied and built; it does not mean the project is community-governed or that every connected model is open source.",
  },
  {
    question: "Can I build Grok Build from source?",
    answer:
      "Yes. Install Git and the Rust toolchain, clone the official repository, then use the documented Cargo commands to build and validate the workspace. Run Clippy and cargo fmt before relying on a local modification. Check the repository README first because prerequisites, crate names, and supported platforms can change after this guide is published.",
  },
  {
    question: "What is the fastest way to get started?",
    answer:
      "Choose the path that matches your goal. Use the Grok Console on this page when you only need a quick text answer or want to compare hosted xAI models. Use xAI’s official installer when you want the terminal agent without compiling it yourself. Clone and build the public Rust repository when inspection, modification, reproducible builds, or internal security review are part of the requirement. In every path, begin with a test repository and a narrowly defined task before granting access to valuable source code or credentials.",
  },
  {
    question: "Is Grok Build the same thing as the Grok Build 0.1 model?",
    answer:
      "No. Grok Build is the coding-agent harness, command-line workflow, and terminal interface. Grok Build 0.1 is a hosted xAI model available through providers such as OpenRouter. The harness determines how repository context, tools, approval, and execution work; the selected model determines inference quality, context capacity, speed, and usage cost.",
  },
  {
    question: "Which xAI model should I choose in the Grok Console?",
    answer:
      "Start with Grok Build 0.1 for coding-agent questions and cost-conscious code work. Choose Grok 4.5 when the task needs stronger reasoning, Grok 4.3 when you need a larger context window, and a Grok 4.20 variant for very long inputs or multi-agent-style analysis. Model availability and pricing change, so use the live context and per-million-token figures above the chat rather than relying on an old screenshot.",
  },
  {
    question: "How much does a conversation cost?",
    answer:
      "OpenRouter bills by tokens according to the selected model’s current input and output rates. The console shows both prices per one million tokens directly from the live model directory. A long conversation costs more because earlier messages are sent again as context, so clear the thread when starting an unrelated task and avoid pasting files or logs that are not needed.",
  },
  {
    question: "Is the OpenRouter API key exposed to visitors?",
    answer:
      "No. The browser sends messages to this site’s server-side /api/chat route, and that route adds the OpenRouter Bearer token before forwarding the request. The key is stored in .env.local, excluded from Git, and absent from the browser JavaScript bundle. Visitors can use the interface without seeing or copying the provider credential.",
  },
  {
    question: "Where is my conversation stored?",
    answer:
      "The visible chat history is stored in localStorage in the current browser so it can survive a refresh. It is not written to this site’s database because this release has no account or persistence backend. Prompts still travel through this server, OpenRouter, and the selected model provider for inference; use Clear conversation to remove the local copy.",
  },
  {
    question: "Can this web console edit my repository or run commands?",
    answer:
      "No. The console on this page is deliberately limited to streamed text chat. It cannot read your filesystem, clone a repository, execute shell commands, call MCP tools, or apply a patch. Use it to clarify an error, draft a plan, compare approaches, or prepare a prompt. To work directly against a repository, install the Grok Build CLI and review its permissions, proposed changes, terminal output, and Git diff in your own environment.",
  },
  {
    question: "How should I describe a real coding task to Grok?",
    answer:
      "State a testable goal, then provide only the context needed to reach it: framework and version, relevant files, current behavior, exact error or reproduction steps, constraints, and the output you expect. For example, ask for a focused patch that preserves an existing API and passes named tests instead of saying only ‘fix it.’ Remove credentials and unrelated logs, request assumptions when evidence is missing, and treat the final diff and test results as proof of completion.",
  },
  {
    question: "Can I paste private source code into the chat?",
    answer:
      "Only paste code you are authorized to send to external inference providers. This interface forwards prompt text to OpenRouter and the selected provider, so confidential repositories, credentials, personal data, and customer secrets require your organization’s approval and an appropriate provider-retention policy. Redact secrets and reduce the prompt to the smallest relevant excerpt.",
  },
  {
    question: "Do I have to use an xAI-hosted model?",
    answer:
      "The open-source Grok Build CLI documentation describes custom model configuration, so the harness and model provider are separate concerns. This website’s console is intentionally restricted to model IDs beginning with x-ai/ because it is a focused Grok experience. If you need other providers, extend the server validation and model directory deliberately instead of accepting arbitrary client-supplied model IDs.",
  },
  {
    question: "Which runtime modes are supported?",
    answer:
      "Official documentation describes three main surfaces: an interactive terminal UI for direct developer work, headless execution for automation, and ACP for editor or client integrations. The right choice depends on the approval boundary: use the TUI for hands-on review, headless mode for controlled scripts, and ACP when another application owns the user interface.",
  },
  {
    question: "Does the repository accept pull requests?",
    answer:
      "Not currently. Its CONTRIBUTING.md says the public repository is provided for transparency and local builds and does not accept external contributions or unsolicited patches. You can still inspect, fork, and modify code under the applicable license, but you should not plan a workflow that depends on upstream accepting your pull request.",
  },
  {
    question: "Does this site call the Grok or OpenRouter API?",
    answer:
      "Yes. The Grok Console sends text conversations through a validated server-side OpenRouter proxy to the selected xAI model and streams the answer back with SSE. Requests are limited to x-ai/ model IDs, a maximum conversation size, and a lightweight per-minute rate guard. The current interface supports text chat and Markdown responses; image uploads, file uploads, tool execution, accounts, and billing are not included.",
  },
  {
    question: "What happens when OpenRouter returns an error?",
    answer:
      "The server converts provider errors into a short user-facing message without exposing the API key or raw provider metadata. Insufficient credits, rate limits, unavailable providers, and invalid requests remain distinguishable through their HTTP status. In the console you can retry the last user turn, switch to another xAI model, reduce the conversation size, or wait for the Retry-After window.",
  },
];
