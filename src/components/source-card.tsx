import { ArrowUpRight } from "lucide-react";

import type { SourceLink } from "@/lib/types";

export function SourceCard({ source, index }: { source: SourceLink; index: number }) {
  return (
    <a
      href={source.href}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-44 flex-col justify-between border-b border-r border-border bg-surface/35 p-5 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:p-6"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {source.kind} / 0{index + 1}
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-accent" />
      </div>
      <div className="mt-10">
        <h3 className="text-sm font-medium text-foreground group-hover:text-accent">
          {source.title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{source.description}</p>
      </div>
    </a>
  );
}
