import { NextResponse } from "next/server";

import { resolveGuestIdentity } from "@/lib/guest-identity";
import { getEntitlementSnapshot } from "@/lib/server-entitlements";
import { createSupabaseContext } from "@/lib/supabase/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guest = resolveGuestIdentity(request);
  const { data: context, error } = await createSupabaseContext({
    auth: ["user", "none"],
  });

  if (error || !context) {
    return NextResponse.json(
      { error: "Account service is temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    const entitlement = await getEntitlementSnapshot(context, guest);
    const response = NextResponse.json(entitlement, {
      headers: { "Cache-Control": "no-store" },
    });
    if (guest.setCookie) response.headers.set("Set-Cookie", guest.setCookie);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Credit account is not ready. Apply the Supabase migration." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
