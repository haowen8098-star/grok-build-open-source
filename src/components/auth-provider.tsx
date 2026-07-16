"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { AuthDialog, type AuthDialogMode } from "@/components/auth-dialog";
import { FREE_QUESTION_LIMIT } from "@/lib/pricing";
import type { EntitlementSnapshot } from "@/lib/server-entitlements";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const DEFAULT_ENTITLEMENT: EntitlementSnapshot = {
  authenticated: false,
  email: null,
  credits: 0,
  freeQuestionsUsed: 0,
  freeQuestionsRemaining: FREE_QUESTION_LIMIT,
};

type AuthContextValue = {
  user: User | null;
  entitlement: EntitlementSnapshot;
  accountLoading: boolean;
  openAuth: (mode?: AuthDialogMode) => void;
  refreshEntitlement: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [entitlement, setEntitlement] =
    useState<EntitlementSnapshot>(DEFAULT_ENTITLEMENT);
  const [accountLoading, setAccountLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<AuthDialogMode>("login");

  const refreshEntitlement = useCallback(async () => {
    try {
      const response = await fetch("/api/account", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) return;
      const payload = (await response.json()) as EntitlementSnapshot;
      setEntitlement(payload);
    } finally {
      setAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data: listener } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null,
    ) => {
      setUser(session?.user || null);
      window.setTimeout(() => void refreshEntitlement(), 0);
    });

    const params = new URLSearchParams(window.location.search);
    const authMode = params.get("auth");
    if (authMode === "reset" || authMode === "confirmed" || authMode === "error") {
      queueMicrotask(() => {
        setDialogMode(authMode === "reset" ? "reset" : "login");
        setDialogOpen(true);
      });
    }
    if (authMode) {
      params.delete("auth");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }

    return () => listener.subscription.unsubscribe();
  }, [refreshEntitlement]);

  const openAuth = useCallback((mode: AuthDialogMode = "login") => {
    setDialogMode(mode);
    setDialogOpen(true);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    await refreshEntitlement();
  }, [refreshEntitlement]);

  const value = useMemo(
    () => ({
      user,
      entitlement,
      accountLoading,
      openAuth,
      refreshEntitlement,
      signOut,
    }),
    [accountLoading, entitlement, openAuth, refreshEntitlement, signOut, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {dialogOpen ? (
        <AuthDialog
          key={dialogMode}
          open
          mode={dialogMode}
          onOpenChange={setDialogOpen}
          onModeChange={setDialogMode}
          onAuthenticated={refreshEntitlement}
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
