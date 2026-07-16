import { CopyCommand } from "@/components/copy-command";

const terminalLines = [
  { prefix: "$", command: "git clone https://github.com/xai-org/grok-build", note: "" },
  { prefix: "$", command: "cd grok-build", note: "" },
  { prefix: "$", command: "cargo run -p xai-grok-pager-bin", note: "# build" },
  { prefix: "✓", command: "agent harness ready", note: "local source" },
];

export function TerminalWindow() {
  return (
    <div className="terminal-shell min-w-0 max-w-full" aria-label="Grok Build source setup terminal">
      <div className="flex h-11 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          grok-build / source
        </span>
      </div>
      <div className="space-y-1.5 p-4 sm:p-5">
        {terminalLines.map((line, index) => (
          <div
            className="group grid min-w-0 grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 font-mono text-[11px] sm:text-xs"
            key={line.command}
          >
            <span className={index === terminalLines.length - 1 ? "text-success" : "text-accent"}>
              {line.prefix}
            </span>
            <div className="min-w-0 overflow-x-auto py-1 scrollbar-none">
              <code className="whitespace-nowrap text-foreground">{line.command}</code>
              {line.note ? (
                <span className="ml-3 whitespace-nowrap text-muted-foreground">{line.note}</span>
              ) : null}
            </div>
            {index < terminalLines.length - 1 ? (
              <div className="opacity-60 transition-opacity group-hover:opacity-100">
                <CopyCommand command={line.command} />
              </div>
            ) : (
              <span className="size-2 rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,0.6)]" />
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 border-t border-border font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground sm:text-[10px]">
        <span className="border-r border-border px-3 py-3">Rust</span>
        <span className="border-r border-border px-3 py-3">Apache-2.0</span>
        <span className="px-3 py-3 text-success">Public source</span>
      </div>
    </div>
  );
}
