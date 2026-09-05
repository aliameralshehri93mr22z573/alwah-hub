"use client";

import { createContext, useContext, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale as persistLocale } from "@/app/locale/actions";
import {
  APP_UI,
  LANDING,
  localeDir,
  localeLang,
  type LandingCopy,
  type Locale,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  copy: LandingCopy;
  app: (typeof APP_UI)[Locale];
  pending: boolean;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = localeLang(locale);
  document.documentElement.dir = localeDir(locale);
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: localeDir(locale),
      copy: LANDING[locale],
      app: APP_UI[locale],
      pending,
      setLocale: (next) => {
        applyDocumentLocale(next);
        startTransition(async () => {
          await persistLocale(next);
          router.refresh();
        });
      },
    }),
    [locale, pending, router],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return context;
}
