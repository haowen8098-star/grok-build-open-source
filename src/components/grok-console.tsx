"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { createParser } from "eventsource-parser";
import {
  Bot,
  Check,
  Coins,
  Copy,
  Cpu,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Send,
  ShieldCheck,
  Square,
  Trash2,
  UserRound,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_XAI_MODEL,
  FALLBACK_XAI_MODELS,
  formatContextLength,
  type ChatMessagePayload,
  type OpenRouterModel,
} from "@/lib/openrouter-types";
import {
  FREE_QUESTION_LIMIT,
  creditsPerMillion,
  formatCredits,
  isPremiumModel,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

type ConsoleMessage = ChatMessagePayload & {
  id: string;
  model?: string;
  createdAt: number;
};

type ConsoleStatus = "idle" | "connecting" | "streaming";

const STORAGE_KEY = "grok-console-session-v1";
const MODEL_STORAGE_KEY = "grok-console-model-v1";

const starterPrompts = [
  "Explain how the Grok Build agent harness is structured.",
  "Review this Rust function for correctness and performance.",
  "Create a migration plan from a closed coding agent to Grok Build.",
  "Show me how to design an MCP server for repository tools.",
];

function createMessage(
  role: ConsoleMessage["role"],
  content: string,
  model?: string,
): ConsoleMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    model,
    createdAt: Date.now(),
  };
}

function isStoredMessage(value: unknown): value is ConsoleMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<ConsoleMessage>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.id === "string" &&
    typeof message.content === "string" &&
    typeof message.createdAt === "number"
  );
}

function modelShortName(model: OpenRouterModel) {
  return model.name.replace(/^xAI:\s*/i, "");
}

export function GrokConsole() {
  const { entitlement, openAuth, refreshEntitlement } = useAuth();
  const [models, setModels] = useState<OpenRouterModel[]>(FALLBACK_XAI_MODELS);
  const [modelSource, setModelSource] = useState<"live" | "fallback">("fallback");
  const [selectedModel, setSelectedModel] = useState(DEFAULT_XAI_MODEL);
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ConsoleStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const restoredPremiumModelRef = useRef<string | null>(null);

  const activeModel = useMemo(
    () =>
      models.find((model) => model.id === selectedModel) ||
      FALLBACK_XAI_MODELS.find((model) => model.id === DEFAULT_XAI_MODEL) ||
      FALLBACK_XAI_MODELS[0],
    [models, selectedModel],
  );

  const isGenerating = status !== "idle";
  const freeQuestionsRemaining = entitlement.freeQuestionsRemaining;
  const premiumUnlocked = entitlement.credits > 0;
  const activeModelIsPremium = isPremiumModel(activeModel.id);
  const accessError = error
    ? /require credits|free questions|guest questions|add credits|sign in|signed-in/i.test(
        error,
      )
    : false;

  useEffect(() => {
    const controller = new AbortController();

    async function loadModels() {
      try {
        const response = await fetch("/api/models", {
          signal: controller.signal,
        });
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
        // The static fallback keeps the selector usable if the directory is unavailable.
      }
    }

    void loadModels();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let restoredMessages: ConsoleMessage[] = [];
    let restoredModel: string | null = null;
    try {
      const storedMessages = localStorage.getItem(STORAGE_KEY);
      const storedModel = localStorage.getItem(MODEL_STORAGE_KEY);

      if (storedMessages) {
        const parsed = JSON.parse(storedMessages) as unknown;
        if (Array.isArray(parsed)) {
          restoredMessages = parsed.filter(isStoredMessage).slice(-40);
        }
      }

      if (storedModel?.startsWith("x-ai/")) {
        restoredModel = storedModel;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }

    queueMicrotask(() => {
      setMessages(restoredMessages);
      if (restoredModel) {
        if (isPremiumModel(restoredModel)) {
          restoredPremiumModelRef.current = restoredModel;
        } else {
          setSelectedModel(restoredModel);
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    const restoredModel = restoredPremiumModelRef.current;
    if (!hydrated || !premiumUnlocked || !restoredModel) return;
    restoredPremiumModelRef.current = null;
    queueMicrotask(() => setSelectedModel(restoredModel));
  }, [hydrated, premiumUnlocked]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  }, [hydrated, messages]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
  }, [hydrated, selectedModel]);

  useEffect(() => {
    if (!hydrated || premiumUnlocked || !isPremiumModel(selectedModel)) return;
    queueMicrotask(() => setSelectedModel(DEFAULT_XAI_MODEL));
  }, [hydrated, premiumUnlocked, selectedModel]);

  useEffect(() => {
    const viewport = chatViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: status === "streaming" ? "auto" : "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  async function requestChat(conversation: ConsoleMessage[]) {
    if (isGenerating || conversation.length === 0) return;

    const assistant = createMessage("assistant", "", selectedModel);
    const controller = new AbortController();
    controllerRef.current = controller;
    setMessages([...conversation, assistant]);
    setStatus("connecting");
    setError(null);

    let receivedText = false;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: conversation.map(({ role, content }) => ({ role, content })),
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "The model request failed.");
      }

      if (!response.body) {
        throw new Error("The model returned an empty stream.");
      }

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const parser = createParser({
        onEvent(event) {
          if (event.data === "[DONE]") return;

          const payload = JSON.parse(event.data) as {
            error?: { message?: string };
            choices?: Array<{
              delta?: {
                content?: string;
              };
            }>;
          };

          if (payload.error) {
            throw new Error(payload.error.message || "The model stream failed.");
          }

          const content = payload.choices?.[0]?.delta?.content;
          if (!content) return;

          receivedText = true;
          setMessages((current) =>
            current.map((message) =>
              message.id === assistant.id
                ? { ...message, content: message.content + content }
                : message,
            ),
          );
        },
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }

      parser.feed(decoder.decode());

      if (!receivedText) {
        throw new Error("The model completed without returning text.");
      }
      await refreshEntitlement();
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        setMessages((current) =>
          current.filter(
            (message) => message.id !== assistant.id || message.content.length > 0,
          ),
        );
      } else {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "The model request failed.";
        setError(message);
        setMessages((current) =>
          current.filter(
            (item) => item.id !== assistant.id || item.content.length > 0,
          ),
        );
      }
    } finally {
      controllerRef.current = null;
      setStatus("idle");
    }
  }

  function canSendMessage() {
    if (activeModelIsPremium && !premiumUnlocked) {
      setError(
        entitlement.authenticated
          ? "Advanced models require credits. View pricing to continue."
          : "Advanced models require a signed-in account with credits.",
      );
      return false;
    }

    if (!activeModelIsPremium && freeQuestionsRemaining > 0) {
      return true;
    }

    if (entitlement.credits <= 0) {
      setError(
        entitlement.authenticated
          ? "Your three free questions are used. Add credits to continue."
          : "Your three guest questions are used. Sign in to continue.",
      );
      return false;
    }

    return true;
  }

  function sendMessage(event?: FormEvent, promptOverride?: string) {
    event?.preventDefault();
    const content = (promptOverride || input).trim();
    if (!content || isGenerating) return;
    if (!canSendMessage()) return;

    const userMessage = createMessage("user", content);
    const conversation = [...messages, userMessage];
    setInput("");
    void requestChat(conversation);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function stopGeneration() {
    controllerRef.current?.abort();
  }

  function clearConversation() {
    controllerRef.current?.abort();
    setMessages([]);
    setError(null);
  }

  function retryLast() {
    if (isGenerating) return;

    let lastUserIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user") {
        lastUserIndex = index;
        break;
      }
    }

    if (lastUserIndex < 0) return;
    if (!canSendMessage()) return;
    void requestChat(messages.slice(0, lastUserIndex + 1));
  }

  return (
    <div className="grok-console overflow-hidden border border-[#303030] bg-[#080808] shadow-[0_28px_80px_rgba(0,0,0,0.42)]">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-[#0d0d0d] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-[#ff5f57]" />
            <span className="size-2 rounded-full bg-[#febc2e]" />
            <span className="size-2 rounded-full bg-[#28c840]" />
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-foreground">
              Grok Playground
            </span>
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              xAI models via OpenRouter
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-label">
            <span
              className={cn(
                "size-1.5 rounded-full",
                modelSource === "live" ? "bg-success" : "bg-accent",
              )}
            />
            {modelSource === "live" ? "Live catalog" : "Cached catalog"}
          </span>
          {messages.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              aria-label="Clear conversation"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid border-b border-border lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(120px,0.4fr))]">
        <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
          <label
            htmlFor="grok-model"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            xAI model
          </label>
          <Select
            value={selectedModel}
            onValueChange={(value) => {
              if (isPremiumModel(value) && !premiumUnlocked) {
                setError("Advanced models require credits. Choose a pack on the pricing page.");
                return;
              }
              setError(null);
              setSelectedModel(value);
            }}
            disabled={isGenerating}
          >
            <SelectTrigger id="grok-model" aria-label="Select xAI model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  disabled={isPremiumModel(model.id) && !premiumUnlocked}
                >
                  <span className="flex items-center gap-2">
                    {modelShortName(model)}
                    {isPremiumModel(model.id) ? (
                      <LockKeyhole className="size-3 text-muted-foreground" />
                    ) : (
                      <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-success">
                        Basic
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ModelStat
          icon={Cpu}
          label="Context"
          value={formatContextLength(activeModel.contextLength)}
        />
        <ModelStat
          icon={Zap}
          label="Input / 1M"
          value={formatCredits(creditsPerMillion(activeModel.pricing.prompt)) + " cr"}
        />
        <ModelStat
          icon={Bot}
          label="Output / 1M"
          value={formatCredits(creditsPerMillion(activeModel.pricing.completion)) + " cr"}
        />
      </div>

      <div className="grid border-b border-border bg-[#0d0d0d] sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 text-xs sm:border-b-0 sm:border-r">
          <span className="text-muted-foreground">Free questions</span>
          <strong className="text-lg font-semibold tabular-nums text-foreground">
            {freeQuestionsRemaining} / {FREE_QUESTION_LIMIT}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 text-xs sm:border-b-0 sm:border-r">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Coins className="size-3.5 text-accent" />
            Credit balance
          </span>
          <strong className="text-lg font-semibold tabular-nums text-accent">
            {formatCredits(entitlement.credits)} cr
          </strong>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-5 py-3 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          View pricing
        </Link>
      </div>

      <div
        ref={chatViewportRef}
        className="grok-chat-viewport"
        aria-live="polite"
        aria-busy={isGenerating}
      >
        {messages.length === 0 ? (
          <div className="flex min-h-[460px] flex-col justify-center px-5 py-12 sm:px-10">
            <div className="grid size-12 place-items-center border border-border bg-surface text-accent">
              <Bot className="size-5" strokeWidth={1.5} />
            </div>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
              {modelShortName(activeModel)} ready
            </p>
            <h3 className="mt-3 max-w-2xl text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-3xl">
              Ask about code, architecture, debugging, or the Grok Build source.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Ask three questions free as a guest. Sign in to keep your account
              balance, then add credits when advanced models become available.
            </p>
            <div className="mt-8 grid gap-2 md:grid-cols-2">
              {starterPrompts.map((prompt, index) => (
                <button
                  type="button"
                  key={prompt}
                  onClick={() => sendMessage(undefined, prompt)}
                  className="group flex min-h-20 items-start justify-between gap-4 border border-border bg-surface/40 p-4 text-left transition-colors hover:border-accent hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="text-xs leading-5 text-muted-foreground transition-colors group-hover:text-foreground">
                    {prompt}
                  </span>
                  <span className="text-[10px] font-semibold tabular-nums text-accent">0{index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isPending={
                  isGenerating &&
                  message.role === "assistant" &&
                  message.id === messages[messages.length - 1]?.id &&
                  !message.content
                }
              />
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div
          className="flex items-start justify-between gap-4 border-t border-[#5a2c2c] bg-[#1b0e0e] px-4 py-3 text-xs text-[#ffb4b4]"
          role="alert"
        >
          <span>{error}</span>
          {accessError ? (
            entitlement.authenticated ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/pricing">View pricing</Link>
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={() => openAuth("login")}>
                Sign in
              </Button>
            )
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={retryLast}>
              <RotateCcw className="size-3.5" />
              Retry
            </Button>
          )}
        </div>
      ) : null}

      <form onSubmit={sendMessage} className="border-t border-border bg-background p-3 sm:p-4">
        <div className="border border-border bg-surface/60 transition-colors focus-within:border-accent">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={"Message " + modelShortName(activeModel) + "…"}
            maxLength={12000}
            rows={3}
            disabled={isGenerating}
            className="min-h-24 w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
            aria-label="Message Grok"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2">
            <div className="flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              <span>Enter to send</span>
              <span>Shift + Enter for line</span>
              <span>{input.length}/12000</span>
            </div>
            {isGenerating ? (
              <Button type="button" variant="outline" size="sm" onClick={stopGeneration}>
                <Square className="size-3 fill-current" />
                Stop
              </Button>
            ) : (
              <Button type="submit" size="sm" disabled={!input.trim()}>
                <Send className="size-3.5" />
                Send
              </Button>
            )}
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 text-[10px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-success" />
          Conversations stay private to this browser until you clear them.
        </span>
        <span>Three free questions. Credits unlock advanced models.</span>
      </div>
    </div>
  );
}

function ModelStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-border p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-accent" strokeWidth={1.5} />
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function ChatMessage({
  message,
  isPending,
}: {
  message: ConsoleMessage;
  isPending: boolean;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article
      className={cn(
        "grid gap-4 px-4 py-6 sm:grid-cols-[120px_minmax(0,1fr)] sm:px-6",
        isUser ? "bg-accent/[0.035]" : "bg-background",
      )}
    >
      <div className="flex items-center gap-2 self-start text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {isUser ? (
          <UserRound className="size-3.5 text-accent" />
        ) : (
          <Bot className="size-3.5 text-success" />
        )}
        {isUser ? "You" : message.model?.replace("x-ai/", "") || "Grok"}
      </div>
      <div className="group min-w-0">
        {isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-accent" />
            Connecting to OpenRouter…
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
            {message.content}
          </p>
        ) : (
          <div className="relative">
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a({ children, ...props }) {
                    return (
                      <a target="_blank" rel="noreferrer" {...props}>
                        {children}
                      </a>
                    );
                  },
                  pre({ children }) {
                    return <pre>{children}</pre>;
                  },
                  code({ node, className, children, ...props }) {
                    void node;
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.content ? (
              <button
                type="button"
                onClick={copyMessage}
                className="absolute -right-1 -top-2 inline-flex size-8 items-center justify-center border border-border bg-surface text-muted-foreground opacity-100 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                aria-label={copied ? "Response copied" : "Copy response"}
              >
                {copied ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
