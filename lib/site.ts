export const SITE_NAME = "ألواح هب | AlwahHub";
export const SITE_DESCRIPTION =
  "مركزك الذكي لإدارة المهام والمشاريع بسلاسة عربية — كانبان RTL، قوالب جاهزة، ودفع عبر مدى و Apple Pay.";

export function siteUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, "")}`;
  }

  return "http://127.0.0.1:3000";
}
