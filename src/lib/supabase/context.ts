import {
  createAdminClient,
  createContextClient,
  verifyCredentials,
} from "@supabase/server/core";
import type {
  AuthModeWithKey,
  SupabaseContext,
  SupabaseEnv,
} from "@supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicSupabaseEnv, getServerSupabaseEnv } from "@/lib/supabase/env";

let cachedJwks: SupabaseEnv["jwks"] = null;

async function getJwks(url: string): Promise<SupabaseEnv["jwks"]> {
  if (cachedJwks) return cachedJwks;

  const jwksUrl =
    process.env.SUPABASE_JWKS_URL ||
    `${url}/auth/v1/.well-known/jwks.json`;

  try {
    const response = await fetch(jwksUrl, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    cachedJwks = (await response.json()) as SupabaseEnv["jwks"];
    return cachedJwks;
  } catch {
    return null;
  }
}

export async function createSupabaseContext(
  options: { auth?: AuthModeWithKey | AuthModeWithKey[] } = { auth: "user" },
): Promise<
  | { data: SupabaseContext; error: null }
  | { data: null; error: Error }
> {
  let publicEnv: ReturnType<typeof getPublicSupabaseEnv>;

  try {
    publicEnv = getPublicSupabaseEnv();
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Supabase is unavailable."),
    };
  }

  const cookieStore = await cookies();
  const ssrClient = createServerClient(
    publicEnv.url,
    publicEnv.publishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
              cookieStore.set(name, value, cookieOptions),
            );
          } catch {
            // Proxy refreshes cookies when the current server context cannot write.
          }
        },
      },
    },
  );

  const {
    data: { session },
  } = await ssrClient.auth.getSession();

  const env: Partial<SupabaseEnv> = {
    ...getServerSupabaseEnv(),
    jwks: await getJwks(publicEnv.url),
  };

  const { data: auth, error } = await verifyCredentials(
    { token: session?.access_token ?? null, apikey: null },
    { auth: options.auth ?? "user", env },
  );

  if (error || !auth) {
    return { data: null, error: error || new Error("Authentication failed.") };
  }

  return {
    data: {
      supabase: createContextClient({
        auth: { token: auth.token },
        env,
      }),
      supabaseAdmin: createAdminClient({ env }),
      userClaims: auth.userClaims,
      jwtClaims: auth.jwtClaims,
      authMode: auth.authMode,
    },
    error: null,
  };
}
