import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { AuthProvider } from "@/components/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/site-config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const googleAnalyticsId = "G-99B6NYYJ7N";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: "Grok Build Open Source: Source Code, Setup & How It Works",
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: "Grok Building" }],
  creator: "Grok Building",
  publisher: "Grok Building",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "grok build open source",
    "grok build github",
    "grok build source code",
    "grok build setup",
    "grok build cli",
    "open source coding agent",
  ],
  openGraph: {
    type: "article",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: "Grok Build Open Source: Source Code, Setup & How It Works",
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Grok Build Open Source terminal guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grok Build Open Source: Source Code, Setup & How It Works",
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
          `}
        </Script>
      </head>
      <body className={geistSans.variable + " " + geistMono.variable}>
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
