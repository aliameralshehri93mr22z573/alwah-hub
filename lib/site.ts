export const SITE_NAME = "ألواح هب | AlwahHub";
export const SITE_DESCRIPTION =
  "مركزك الذكي لإدارة المهام والمشاريع بسلاسة عربية — كانبان RTL، قوالب جاهزة، ودفع عبر مدى و Apple Pay.";

function isLoopbackHost(value: string) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value);
}

export function siteUrl() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "";
  if (explicit && !isLoopbackHost(explicit)) {
    return explicit.replace(/\/$/, "");
  }

  const renderUrl = process.env.RENDER_EXTERNAL_URL ?? "";
  if (renderUrl) {
    return renderUrl.replace(/\/$/, "");
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, "")}`;
  }

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  return "http://127.0.0.1:3000";
}
