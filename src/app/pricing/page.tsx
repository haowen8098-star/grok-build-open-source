import type { Metadata } from "next";
import Link from "next/link";

import { PricingExperience } from "@/components/pricing-experience";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Grok Pricing: 3 Free Questions & Credit Packs",
  description:
    "Try three free Grok Build questions, compare advanced xAI model rates, estimate credits, and preview Grok credit packs.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Grok Pricing: 3 Free Questions & Credit Packs",
    description:
      "Transparent Grok credit pricing based on current xAI model input and output rates.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <PricingExperience />
      <footer className="border-t border-border bg-surface/30">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-5 py-10 text-xs text-muted-foreground sm:px-8 md:flex-row md:items-end">
          <p className="max-w-2xl leading-6">
            Account balances and free questions are enforced server-side. Checkout is
            coming later; no payment information is collected today.
          </p>
          <Link href="/" className="font-medium text-foreground hover:text-accent">
            Back to Grok Build guide
          </Link>
        </div>
      </footer>
    </>
  );
}
