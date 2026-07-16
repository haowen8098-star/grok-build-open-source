"use client";

import { ArrowUpRight, GitFork, Menu } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full min-w-0 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="GB — Grok Build Open Source home"
        >
          <span className="grid size-8 place-items-center border border-border bg-surface font-mono text-[10px] text-accent transition-colors group-hover:border-accent">
            GB
          </span>
          <span className="hidden font-mono text-xs font-medium uppercase tracking-[0.16em] text-foreground sm:block">
            Open Source Guide
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {siteConfig.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Button asChild variant="ghost" size="sm">
            <a href={siteConfig.installUrl} target="_blank" rel="noreferrer">
              Install
              <ArrowUpRight className="size-3.5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
              <GitFork className="size-3.5" />
              GitHub
            </a>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="xl:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="font-mono text-sm uppercase tracking-[0.15em]">
              Grok Build / OSS
            </SheetTitle>
            <SheetDescription className="mt-2 text-sm text-muted-foreground">
              Source, setup, and architecture.
            </SheetDescription>
            <nav className="mt-10 flex flex-col" aria-label="Mobile navigation">
              {siteConfig.navItems.map((item, index) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between border-b border-border py-4 text-base text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {item.label}
                    <span className="font-mono text-[10px] text-muted-foreground">
                      0{index + 1}
                    </span>
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              <Button asChild>
                <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
                  <GitFork className="size-4" />
                  View source
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={siteConfig.installUrl} target="_blank" rel="noreferrer">
                  Install Grok Build
                  <ArrowUpRight className="size-4" />
                </a>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
