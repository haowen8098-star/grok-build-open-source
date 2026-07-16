import { ArrowRight, Bot, Braces, Cpu, FolderGit2, TerminalSquare } from "lucide-react";

const nodes = [
  { label: "Repository", detail: "Source + AGENTS.md", icon: FolderGit2 },
  { label: "Agent runtime", detail: "Plan + execute", icon: Bot },
  { label: "Tools / MCP", detail: "Inspect + change", icon: Braces },
  { label: "Model", detail: "Reasoning engine", icon: Cpu },
  { label: "Terminal", detail: "Review + approve", icon: TerminalSquare },
];

export function ArchitectureFlow() {
  return (
    <div className="architecture-grid mt-10">
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <div className="contents" key={node.label}>
            <div className="architecture-node">
              <div className="flex items-center justify-between">
                <Icon className="size-5 text-accent" strokeWidth={1.5} />
                <span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-8 text-sm font-medium text-foreground">{node.label}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">{node.detail}</p>
            </div>
            {index < nodes.length - 1 ? (
              <ArrowRight className="architecture-arrow size-4 text-muted-foreground" aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
