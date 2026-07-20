import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckCircle2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { blogArticles } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Grok Build Blog — Coding Agents, Architecture, and Source Guides",
  description:
    "Developer guides about AI agent frameworks, coding-agent architecture, source builds, tool boundaries, and reviewable workflows.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Grok Build Blog",
    description:
      "Practical notes on coding agents, source builds, tool boundaries, and reviewable AI workflows.",
    siteName: siteConfig.name,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Grok Building developer guides" }],
  },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export default function BlogIndexPage() {
  const featuredArticle = blogArticles[0];
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Grok Build Blog",
    description: metadata.description,
    url: `${siteConfig.url}/blog`,
    blogPost: blogArticles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      url: `${siteConfig.url}/blog/${article.slug}`,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content" className="site-grid min-h-screen">
        <section className="border-b border-border">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end lg:py-24">
            <div>
              <div className="mb-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                <span className="h-px w-8 bg-accent" aria-hidden="true" />
                Developer field notes
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.055em] text-foreground sm:text-6xl lg:text-[78px] lg:leading-[0.98]">
                Build agents you can inspect.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Practical guides to agent architecture, source builds, tool boundaries, and the review loops that keep AI-assisted code work understandable.
              </p>
            </div>

            <aside className="border-l border-border pl-6 lg:pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Editorial scope
              </p>
              <ul className="mt-5 space-y-3 text-sm text-foreground">
                {[
                  "Agent architecture",
                  "Source and setup guides",
                  "Tool and approval boundaries",
                  "Tests, diffs, and review",
                ].map((topic) => (
                  <li key={topic} className="flex items-center gap-3">
                    <CheckCircle2 className="size-4 text-accent" aria-hidden="true" />
                    {topic}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 lg:py-20">
          <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">Latest guide</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-foreground">Read the first field note</h2>
            </div>
            <p className="hidden font-mono text-xs text-muted-foreground sm:block">
              {String(blogArticles.length).padStart(2, "0")} published
            </p>
          </div>

          {featuredArticle ? (
            <article className="group grid overflow-hidden border border-border bg-surface-raised lg:grid-cols-[1.05fr_0.95fr]">
              <Link href={`/blog/${featuredArticle.slug}`} className="relative block min-h-[270px] overflow-hidden border-b border-border lg:min-h-[430px] lg:border-b-0 lg:border-r" aria-label={`Read ${featuredArticle.title}`}>
                <Image
                  src={featuredArticle.cover}
                  alt={featuredArticle.coverAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 620px, 100vw"
                  className="bg-[#050505] object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-border/80 bg-background/90 px-5 py-3 backdrop-blur-sm">
                  <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-accent">Architecture / Guide</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">01</span>
                </div>
              </Link>

              <div className="flex flex-col justify-between p-6 sm:p-9 lg:p-11">
                <div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <span>{formatDate(featuredArticle.publishedAt)}</span>
                    <span className="size-1 bg-accent" aria-hidden="true" />
                    <span>Developer guide</span>
                  </div>
                  <h3 className="mt-7 text-3xl font-medium leading-tight tracking-[-0.04em] text-foreground sm:text-4xl">
                    <Link href={`/blog/${featuredArticle.slug}`} className="decoration-accent underline-offset-8 hover:underline">
                      {featuredArticle.title}
                    </Link>
                  </h3>
                  <p className="mt-6 text-sm leading-7 text-muted-foreground sm:text-base">
                    {featuredArticle.compactSummary}
                  </p>
                </div>

                <Link href={`/blog/${featuredArticle.slug}`} className="mt-10 inline-flex w-fit items-center gap-2 border-b border-accent pb-1 text-sm font-semibold text-foreground transition-colors hover:text-accent">
                  Read the guide
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ) : (
            <div className="flex min-h-72 items-center justify-center border border-border bg-surface-raised text-muted-foreground">
              <BookOpen className="mr-3 size-5" aria-hidden="true" />
              New field notes are being prepared.
            </div>
          )}
        </section>

        <section className="border-t border-border bg-surface/30">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">From concepts to source</p>
              <h2 className="mt-3 max-w-xl text-2xl font-medium tracking-[-0.03em] text-foreground">
                Continue with the source-backed Grok Build guide.
              </h2>
            </div>
            <Link href="/" className="inline-flex w-fit items-center gap-2 border border-foreground px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background">
              Explore Grok Building
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
