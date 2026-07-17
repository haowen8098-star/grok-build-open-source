"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Coins,
  GitFork,
  LogIn,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatCredits } from "@/lib/pricing";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  const {
    user,
    entitlement,
    accountLoading,
    openAuth,
    signOut,
  } = useAuth();

  const balanceLabel = accountLoading
    ? "Loading balance"
    : entitlement.credits > 0
      ? `${formatCredits(entitlement.credits)} credits`
      : `${entitlement.freeQuestionsRemaining} free`;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full min-w-0 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Grok Building home"
        >
          <span className="grid size-8 place-items-center border border-border bg-surface transition-colors group-hover:border-accent">
            <Image
              src="/icon.png"
              alt=""
              width={32}
              height={32}
              style={{ width: 32, height: 32 }}
              priority
            />
          </span>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.1em] text-foreground sm:block">
            Grok Building
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
          <Link
            href="/pricing"
            className="inline-flex h-9 items-center gap-2 border border-border bg-surface/60 px-3 text-xs font-medium text-foreground transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Current balance: ${balanceLabel}`}
          >
            <Coins className="size-3.5 text-accent" />
            {balanceLabel}
          </Link>

          {user ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              title={user.email || "Signed in"}
            >
              <UserRound className="size-3.5 text-success" />
              <span className="max-w-32 truncate">{user.email}</span>
              <LogOut className="size-3.5" />
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => openAuth("login")}>
              <LogIn className="size-3.5" />
              Sign in
            </Button>
          )}

          <Button asChild variant="outline" size="icon">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="View Grok Build on GitHub"
            >
              <GitFork className="size-3.5" />
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
            <SheetTitle className="text-sm font-semibold uppercase tracking-[0.1em]">
              Grok Building
            </SheetTitle>
            <SheetDescription className="mt-2 text-sm text-muted-foreground">
              Source guide, live Grok console, and account balance.
            </SheetDescription>

            <Link
              href="/pricing"
              className="mt-7 flex items-center justify-between border border-border bg-surface p-4 text-sm text-foreground"
            >
              <span className="inline-flex items-center gap-2">
                <Coins className="size-4 text-accent" />
                Balance
              </span>
              <strong>{balanceLabel}</strong>
            </Link>

            <nav className="mt-6 flex flex-col" aria-label="Mobile navigation">
              {siteConfig.navItems.map((item, index) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between border-b border-border py-4 text-base text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {item.label}
                    <span className="text-[10px] text-muted-foreground">0{index + 1}</span>
                  </Link>
                </SheetClose>
              ))}
            </nav>

            <div className="mt-8 grid gap-3">
              {user ? (
                <SheetClose asChild>
                  <Button type="button" variant="outline" onClick={() => void signOut()}>
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                </SheetClose>
              ) : (
                <SheetClose asChild>
                  <Button type="button" onClick={() => openAuth("login")}>
                    <LogIn className="size-4" />
                    Sign in or register
                  </Button>
                </SheetClose>
              )}
              <Button asChild variant="outline">
                <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
                  <GitFork className="size-4" />
                  GitHub source
                </a>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
