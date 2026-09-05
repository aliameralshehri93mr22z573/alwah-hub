import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import { MobileNav } from "@/components/mobile-nav";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeDir, localeLang } from "@/lib/i18n";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={localeLang(locale)}
      dir={localeDir(locale)}
      data-scroll-behavior="smooth"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-primary font-sans text-foreground">
        <LocaleProvider locale={locale}>
          {children}
          <MobileNav />
        </LocaleProvider>
      </body>
    </html>
  );
}
