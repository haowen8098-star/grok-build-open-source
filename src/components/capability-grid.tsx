import { capabilities } from "@/lib/content";

export function CapabilityGrid() {
  return (
    <div className="mt-10 grid border-l border-t border-border md:grid-cols-2">
      {capabilities.map((capability) => (
        <article
          key={capability.index}
          className="group min-h-64 border-b border-r border-border bg-surface/45 p-6 transition-colors duration-200 hover:bg-surface sm:p-8"
        >
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-semibold tabular-nums tracking-[0.12em] text-accent">
              /{capability.index}
            </span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {capability.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-border px-2 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <h3 className="mt-16 text-xl font-medium tracking-[-0.02em] text-foreground">
            {capability.title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            {capability.description}
          </p>
        </article>
      ))}
    </div>
  );
}
