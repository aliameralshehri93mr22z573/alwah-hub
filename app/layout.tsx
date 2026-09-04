import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { MobileNav } from "@/components/mobile-nav";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "ألواح هب",
    "AlwahHub",
    "كانبان",
    "إدارة مهام",
    "إدارة مشاريع",
    "مدى",
    "Apple Pay",
  ],
  authors: [{ name: "AlwahHub" }],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "ar_SA",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-primary font-sans text-foreground">
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
