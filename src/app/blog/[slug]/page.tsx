import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { blogArticles, getBlogArticle } from "@/lib/blog";
import { siteConfig } from "@/lib/site-config";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${article.slug}`,
      title: article.metaTitle,
      description: article.metaDescription,
      siteName: siteConfig.name,
      images: [{ url: article.cover, width: 1200, height: 630, alt: article.coverAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [article.cover],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogPageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    notFound();
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: `${siteConfig.url}/blog/${article.slug}`,
    image: `${siteConfig.url}${article.cover}`,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    inLanguage: "en-US",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="site-grid min-h-screen">
        <div className="mx-auto w-full max-w-[1240px] px-5 py-12 sm:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <article className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Developer guide</p>
              <h1 className="mt-5 max-w-4xl text-pretty text-4xl font-medium leading-[1.04] tracking-[-0.045em] text-foreground sm:text-5xl">
                {article.title}
              </h1>
              <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground">{article.compactSummary}</p>
              <p className="mt-5 text-sm text-muted-foreground">
                Published July 20, 2026 · Updated July 20, 2026 · Source-backed by first-party documentation
              </p>

              <section className="mt-10 border-y border-border py-7" aria-labelledby="key-takeaways">
                <h2 id="key-takeaways" className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                  Key takeaways
                </h2>
                <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
                  {article.keyTakeaways.map((takeaway) => (
                    <li key={takeaway} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="definition" className="mt-12 scroll-mt-24">
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">The short definition</h2>
                <p className="mt-4 text-[1.05rem] leading-8 text-muted-foreground">
                  An AI agent framework is the software layer that gives a model an operating loop. It accepts a task and relevant context, lets the system use a bounded set of tools, keeps track of state, observes results, and applies policies before the next step. The framework is not the model, a chat window, or a promise that the system can act safely on its own. It is the structure that makes multi-step behavior explicit enough to inspect, test, and control.
                </p>
                <p className="mt-4 text-[1.05rem] leading-8 text-muted-foreground">
                  That distinction matters for developers because an agent can touch files, services, and credentials. A useful framework makes the path from instruction to tool call to result review visible. If that path is hidden, a system may look capable while leaving you unable to explain why it selected a tool, what context it used, or what needs a human decision.
                </p>
              </section>

              <section id="boundaries" className="mt-12 scroll-mt-24">
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">Framework vs. model vs. coding-agent harness</h2>
                <div className="mt-5 overflow-x-auto border border-border">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead className="bg-surface text-xs uppercase tracking-[0.1em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Layer</th>
                        <th className="px-4 py-3 font-medium">Primary job</th>
                        <th className="px-4 py-3 font-medium">What to verify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                      <tr><td className="px-4 py-4 text-foreground">LLM</td><td className="px-4 py-4">Interprets inputs and proposes a next step or response.</td><td className="px-4 py-4">Model behavior, context limits, cost, and provider controls.</td></tr>
                      <tr><td className="px-4 py-4 text-foreground">Agent framework</td><td className="px-4 py-4">Coordinates state, tools, execution rules, observation, and handoffs.</td><td className="px-4 py-4">Tool allowlists, retries, logs, approval boundaries, and policy enforcement.</td></tr>
                      <tr><td className="px-4 py-4 text-foreground">Coding-agent harness</td><td className="px-4 py-4">Applies those patterns to repository context, terminals, tests, and diffs.</td><td className="px-4 py-4">Project instructions, file scope, command access, source provenance, and review workflow.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-[1.05rem] leading-8 text-muted-foreground">
                  A coding-agent harness can use framework patterns, but it serves a narrower job. It should be evaluated as a repository workflow: how it reads instructions, which tools it can call, how it shows changes, and where developers can stop or approve an action. That is more useful than treating every tool that calls a model as the same kind of framework.
                </p>
              </section>

              <section id="operating-loop" className="mt-12 scroll-mt-24">
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">The operating loop a framework makes explicit</h2>
                <ol className="mt-5 grid gap-4 border-l border-border pl-6 text-[1.05rem] leading-8 text-muted-foreground">
                  <li><strong className="text-foreground">Context and instructions.</strong> The system starts with a bounded task, relevant files or data, and rules that say what success looks like.</li>
                  <li><strong className="text-foreground">Planning and tool selection.</strong> The model proposes a next step, while the framework decides which tool interfaces are available and how inputs are validated.</li>
                  <li><strong className="text-foreground">Execution and observation.</strong> A tool returns a result; the framework records it so the next step is based on evidence rather than a guessed success state.</li>
                  <li><strong className="text-foreground">Review and handoff.</strong> A policy, a test, or a developer decides whether to continue, retry, stop, or accept the result.</li>
                </ol>
              </section>

              {article.inlineConversionModules.map((module) => (
                <aside key={module.target} className="mt-10 border border-accent/40 bg-surface-raised p-4 sm:p-5">
                  <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
                    <Image src={module.image.src} alt={module.image.alt} width={1200} height={630} className="aspect-[1.9/1] w-full border border-border object-cover" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-accent">Recommended next</p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{module.prompt}</p>
                      <h2 className="mt-1 text-lg font-medium text-foreground">{module.title}</h2>
                      <Link href={module.target} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-accent underline-offset-4 hover:text-accent">
                        {module.cta}<ArrowUpRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </aside>
              ))}

              <section id="coding-workflow" className="mt-12 scroll-mt-24">
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">What this looks like in a coding workflow</h2>
                <p className="mt-4 text-[1.05rem] leading-8 text-muted-foreground">
                  For repository work, the framework&apos;s value is not that it makes a terminal autonomous. Its value is that it can keep the loop constrained. Project instructions can define conventions; a tool allowlist can limit which commands run; a worktree or test repository can narrow blast radius; and the final diff plus test output can become the evidence a reviewer needs.
                </p>
                <p className="mt-4 text-[1.05rem] leading-8 text-muted-foreground">
                  Grok Build is useful to study through this lens. The public project is a coding-agent harness and command-line workflow, not a generic answer engine. Read the first-party <a className="text-accent underline underline-offset-4" href="https://x.ai/open-source" target="_blank" rel="noreferrer">open-source announcement</a>, inspect the <a className="text-accent underline underline-offset-4" href="https://github.com/xai-org/grok-build" target="_blank" rel="noreferrer">public repository</a>, and verify the current <a className="text-accent underline underline-offset-4" href="https://docs.x.ai/build/overview" target="_blank" rel="noreferrer">documentation</a> before treating any setup detail as stable.
                </p>
              </section>

              <section id="selection-checklist" className="mt-12 scroll-mt-24">
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">A practical selection checklist</h2>
                <div className="mt-5 grid gap-3">
                  {[
                    "Can you name the exact task, file scope, and systems the agent may touch?",
                    "Are tool permissions and credentials separated from ordinary prompts?",
                    "Does every consequential command have an observable result and a clear stop condition?",
                    "Can a developer review source provenance, tests, command output, and diffs before accepting a change?",
                    "Is the model choice separate from the harness and execution policy, so it can change without rewriting your safety boundary?",
                  ].map((item) => (
                    <p key={item} className="border border-border bg-surface px-4 py-4 text-sm leading-6 text-muted-foreground">{item}</p>
                  ))}
                </div>
              </section>

              <section className="mt-12 border-t border-border pt-10">
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">First-party sources</h2>
                <ul className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground">
                  {article.authorityLinks.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-accent underline-offset-4 hover:text-accent">{source.label}</a>
                      <span> — {source.reason}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="faq" className="mt-12 scroll-mt-24 border-t border-border pt-10">
                <h2 className="text-2xl font-medium tracking-[-0.03em] text-foreground">Frequently asked questions</h2>
                <div className="mt-5 divide-y divide-border border-y border-border">
                  {article.faqs.map((faq) => (
                    <details key={faq.question} className="group py-5">
                      <summary className="cursor-pointer list-none pr-8 text-base font-medium text-foreground marker:hidden">{faq.question}</summary>
                      <p className="mt-3 text-[1.02rem] leading-8 text-muted-foreground">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            </article>

            <aside className="hidden border-l border-border pl-6 lg:sticky lg:top-24 lg:block" aria-label="On this page">
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">On this page</p>
              <nav className="mt-4 grid gap-3">
                {article.sidebarLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-sm leading-5 text-muted-foreground hover:text-accent">{link.label}</a>
                ))}
              </nav>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
