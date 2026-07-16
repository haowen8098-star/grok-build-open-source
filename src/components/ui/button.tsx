import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
};

const variants = {
  primary:
    "border border-accent bg-accent text-black hover:bg-accent/90 hover:border-white",
  outline:
    "border border-border bg-surface/60 text-foreground hover:border-muted-foreground hover:bg-surface-raised",
  ghost:
    "border border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface",
};

const sizes = {
  default: "h-11 px-5 text-sm",
  sm: "h-9 px-3 text-xs",
  icon: "size-10",
};

export function Button({
  className,
  variant = "primary",
  size = "default",
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
