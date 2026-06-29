import type { Metadata, Viewport } from "next";
import "./globals.css";

// Absolute base for OG/icon URLs — crawlers (Google, social) need absolute URLs.
// Defaults to the primary production origin; override per-environment with
// NEXT_PUBLIC_SITE_URL (e.g. a preview/staging URL).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://joinrory.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Rory — Fan Gifts. Low Fees.",
    template: "%s · Rory",
  },
  description:
    "Rory lets creators set goals for their projects and fans donate to help achieve them.",
  applicationName: "Rory",
  // Favicons / app icons (realfavicongenerator pack). Next renders these into <head>
  // as <link rel=...> tags that Google and browsers pick up.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Rory",
    title: "Rory — Fan Gifts. Low Fees.",
    description:
      "Rory lets creators set goals for their projects and fans donate to help achieve them.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rory — Fan Gifts. Low Fees.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rory — Fan Gifts. Low Fees.",
    description:
      "Rory lets creators set goals for their projects and fans donate to help achieve them.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#3c7fc7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
