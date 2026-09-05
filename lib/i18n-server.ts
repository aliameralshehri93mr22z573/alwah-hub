import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LANDING,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getLandingCopy() {
  const locale = await getRequestLocale();
  return { locale, copy: LANDING[locale] };
}
