import type { SupabaseEnv } from "@supabase/server";

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return { url, publishableKey };
}

export function getServerSupabaseEnv(): Partial<SupabaseEnv> {
  const { url, publishableKey } = getPublicSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  return {
    url,
    publishableKeys: { default: publishableKey },
    secretKeys: secretKey ? { default: secretKey } : {},
  };
}
