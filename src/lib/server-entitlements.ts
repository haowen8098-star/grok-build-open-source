import "server-only";

import type { SupabaseContext } from "@supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { FREE_QUESTION_LIMIT } from "@/lib/pricing";
import type { Database } from "@/lib/supabase/database.types";

export type EntitlementSnapshot = {
  authenticated: boolean;
  email: string | null;
  credits: number;
  freeQuestionsUsed: number;
  freeQuestionsRemaining: number;
};

type GuestIdentity = {
  guestHash: string;
  ipHash: string;
};

type UsageReservation = {
  allowed: boolean;
  mode: "free" | "credits" | null;
  reason: string | null;
};

type UserClaims = {
  id?: string;
  sub?: string;
  email?: string;
};

export function getContextUser(context: SupabaseContext) {
  const claims = context.userClaims as UserClaims | null;
  const id = claims?.id || claims?.sub || null;
  return id ? { id, email: claims?.email || null } : null;
}

export async function getEntitlementSnapshot(
  context: SupabaseContext,
  guest: GuestIdentity,
): Promise<EntitlementSnapshot> {
  const user = getContextUser(context);
  const admin = context.supabaseAdmin as unknown as SupabaseClient<Database>;

  if (user) {
    await admin
      .from("grok_credit_accounts")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

    const { data, error } = await admin
      .from("grok_credit_accounts")
      .select("balance, free_questions_used")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    const used = Number(data.free_questions_used || 0);
    return {
      authenticated: true,
      email: user.email,
      credits: Number(data.balance || 0),
      freeQuestionsUsed: used,
      freeQuestionsRemaining: Math.max(0, FREE_QUESTION_LIMIT - used),
    };
  }

  const [{ data: guestRow, error: guestError }, { data: ipRow, error: ipError }] =
    await Promise.all([
      admin
        .from("grok_guest_allowances")
        .select("free_questions_used")
        .eq("guest_hash", guest.guestHash)
        .maybeSingle(),
      admin
        .from("grok_guest_ip_allowances")
        .select("free_questions_used")
        .eq("ip_hash", guest.ipHash)
        .maybeSingle(),
    ]);

  if (guestError) throw guestError;
  if (ipError) throw ipError;

  const used = Math.max(
    Number(guestRow?.free_questions_used || 0),
    Number(ipRow?.free_questions_used || 0),
  );

  return {
    authenticated: false,
    email: null,
    credits: 0,
    freeQuestionsUsed: used,
    freeQuestionsRemaining: Math.max(0, FREE_QUESTION_LIMIT - used),
  };
}

export async function reserveUsage(
  context: SupabaseContext,
  guest: GuestIdentity,
  input: {
    requestId: string;
    model: string;
    reservedCredits: number;
  },
): Promise<UsageReservation> {
  const user = getContextUser(context);
  const admin = context.supabaseAdmin as unknown as SupabaseClient<Database>;

  if (user) {
    const { data, error } = await admin.rpc(
      "reserve_authenticated_grok_usage",
      {
        p_user_id: user.id,
        p_request_id: input.requestId,
        p_model: input.model,
        p_reserved_credits: input.reservedCredits,
      },
    );
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    return {
      allowed: Boolean(result?.allowed),
      mode: result?.usage_mode === "free" ? "free" : "credits",
      reason: result?.reason || null,
    };
  }

  const { data, error } = await admin.rpc(
    "reserve_guest_grok_usage",
    {
      p_guest_hash: guest.guestHash,
      p_ip_hash: guest.ipHash,
      p_request_id: input.requestId,
      p_model: input.model,
    },
  );
  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  return {
    allowed: Boolean(result?.allowed),
    mode: result?.allowed ? "free" : null,
    reason: result?.reason || null,
  };
}

export async function releaseUsage(
  context: SupabaseContext,
  requestId: string,
  errorMessage: string,
) {
  const admin = context.supabaseAdmin as unknown as SupabaseClient<Database>;
  await admin.rpc("release_grok_usage", {
    p_request_id: requestId,
    p_error_message: errorMessage,
  });
}

export async function settleUsage(
  context: SupabaseContext,
  input: {
    requestId: string;
    actualCredits: number;
    providerCostUsd: number;
    promptTokens: number;
    completionTokens: number;
    generationId: string;
  },
) {
  const admin = context.supabaseAdmin as unknown as SupabaseClient<Database>;
  const { error } = await admin.rpc("settle_grok_usage", {
    p_request_id: input.requestId,
    p_actual_credits: input.actualCredits,
    p_provider_cost_usd: input.providerCostUsd,
    p_prompt_tokens: input.promptTokens,
    p_completion_tokens: input.completionTokens,
    p_generation_id: input.generationId,
  });
  if (error) throw error;
}
