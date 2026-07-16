"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

export type AuthDialogMode = "login" | "signup" | "forgot" | "reset";

type AuthDialogProps = {
  open: boolean;
  mode: AuthDialogMode;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: AuthDialogMode) => void;
  onAuthenticated: () => Promise<void> | void;
};

export function AuthDialog({
  open,
  mode,
  onOpenChange,
  onModeChange,
  onAuthenticated,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPasswordForm = mode !== "forgot";
  const title =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : mode === "reset"
          ? "Choose a new password"
          : "Welcome back";
  const description =
    mode === "signup"
      ? "Verify your email to keep your free questions and credit balance across devices."
      : mode === "forgot"
        ? "We will send a secure password-reset link to your email."
        : mode === "reset"
          ? "Use at least eight characters for your new password."
          : "Sign in to continue with your saved Grok balance.";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/?auth=confirmed")}`,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Check your inbox and verify your email before signing in.");
          return;
        }
        await onAuthenticated();
        onOpenChange(false);
        return;
      }

      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/?auth=reset")}`,
          },
        );
        if (resetError) throw resetError;
        setMessage("Password reset link sent. Check your inbox.");
        return;
      }

      if (mode === "reset") {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage("Password updated. You are signed in.");
        await onAuthenticated();
        return;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (!data.session) throw new Error("No session was returned. Please try again.");
      await onAuthenticated();
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Authentication failed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="auth-dialog-description">
        <div className="mb-7 flex items-center gap-3">
          <div className="grid size-10 place-items-center border border-accent/50 bg-accent/10 text-accent">
            <LockKeyhole className="size-4" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-accent">
              Grok Building account
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Secure email access</p>
          </div>
        </div>

        <DialogTitle className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
          {title}
        </DialogTitle>
        <DialogDescription
          id="auth-dialog-description"
          className="mt-2 text-sm leading-6 text-muted-foreground"
        >
          {description}
        </DialogDescription>

        {mode === "login" || mode === "signup" ? (
          <div className="mt-6 grid grid-cols-2 border border-border p-1">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onModeChange(tab)}
                className={cn(
                  "h-9 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  mode === tab
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>
        ) : null}

        {mode !== "reset" ? (
          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full justify-center"
            disabled
            aria-disabled="true"
            title="Google sign-in is coming soon"
          >
            <span aria-hidden="true" className="text-sm font-semibold">G</span>
            Continue with Google
            <span className="ml-auto text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              Soon
            </span>
          </Button>
        ) : null}

        {mode === "login" || mode === "signup" ? (
          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            Email
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode !== "reset" ? (
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-foreground">Email</span>
              <span className="flex items-center border border-border bg-surface/60 focus-within:border-accent">
                <Mail className="ml-3 size-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </span>
            </label>
          ) : null}

          {isPasswordForm ? (
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-foreground">
                {mode === "reset" ? "New password" : "Password"}
              </span>
              <span className="flex items-center border border-border bg-surface/60 focus-within:border-accent">
                <LockKeyhole className="ml-3 size-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="At least 8 characters"
                  className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </span>
            </label>
          ) : null}

          {error ? <p className="text-xs leading-5 text-[#ff9d9d]">{error}</p> : null}
          {message ? <p className="text-xs leading-5 text-success">{message}</p> : null}

          <Button type="submit" className="w-full justify-center" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : mode === "reset"
                  ? "Update password"
                  : "Sign in"}
            {!pending ? <ArrowRight className="size-4" /> : null}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => onModeChange("forgot")}
              className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Forgot password?
            </button>
          ) : mode === "forgot" || mode === "reset" ? (
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Back to sign in
            </button>
          ) : (
            <span>Email verification required</span>
          )}
          <span>3 guest questions included</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
