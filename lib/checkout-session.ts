import { isPlanTier, planOf, type PlanTier } from "@/lib/plans";
import { paymentProvider } from "@/lib/billing";
import { siteUrl } from "@/lib/site";

export type CheckoutResult =
  | { ok: true; checkoutUrl: string; provider: "moyasar" | "tap" }
  | { ok: false; status: number; error: string };

export async function resolveCheckoutPlan(request: Request) {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("plan");
  const contentType = request.headers.get("content-type") ?? "";

  if (fromQuery) {
    return fromQuery;
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as { plan?: string } | null;
    return body?.plan ?? "";
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData().catch(() => null);
    return String(form?.get("plan") ?? "");
  }

  return "";
}

export function paidPlanFrom(
  value: string | null | undefined,
): Exclude<PlanTier, "free"> | null {
  if (!value || !isPlanTier(value) || value === "free") {
    return null;
  }
  return value;
}

export async function createCheckoutUrl(
  planId: Exclude<PlanTier, "free">,
  userId: string,
): Promise<CheckoutResult> {
  const plan = planOf(planId);
  const origin = siteUrl();
  const callbackUrl = `${origin}/billing/success`;
  const webhookUrl = `${origin}/api/billing/webhook`;
  const provider = paymentProvider();

  if (provider === "tap") {
    const secret = process.env.TAP_SECRET_KEY;
    if (!secret) {
      return {
        ok: false,
        status: 503,
        error: "لم تُضبط مفاتيح Tap Payments بعد.",
      };
    }

    const response = await fetch("https://api.tap.company/v2/charges", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: plan.monthlySar,
        currency: "SAR",
        threeDSecure: true,
        save_card: false,
        description: `اشتراك ألواح هب — ${plan.name}`,
        metadata: { user_id: userId, plan: plan.id, product: "alwahhub" },
        source: { id: "src_all" },
        redirect: { url: callbackUrl },
        post: { url: webhookUrl },
      }),
    });

    const payload = (await response.json()) as {
      transaction?: { url?: string };
      url?: string;
      errors?: { description?: string }[];
    };
    const checkoutUrl = payload.transaction?.url ?? payload.url;
    if (!response.ok || !checkoutUrl) {
      return {
        ok: false,
        status: 502,
        error:
          payload.errors?.[0]?.description ??
          "تعذّر إنشاء عملية Tap مع مدى و Apple Pay.",
      };
    }
    return { ok: true, checkoutUrl, provider: "tap" };
  }

  const secret = process.env.MOYASAR_SECRET_KEY;
  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: "لم تُضبط مفاتيح Moyasar بعد.",
    };
  }

  const invoice = new URLSearchParams();
  invoice.set("amount", String(plan.amountHalalas));
  invoice.set("currency", "SAR");
  invoice.set("description", `اشتراك ألواح هب — ${plan.name} (مدى و Apple Pay)`);
  invoice.set("callback_url", callbackUrl);
  invoice.set("success_url", `${origin}/billing/success`);
  invoice.set("back_url", `${origin}/pricing`);
  invoice.append("allowed_methods[]", "creditcard");
  invoice.append("allowed_methods[]", "applepay");
  invoice.set("metadata[user_id]", userId);
  invoice.set("metadata[plan]", plan.id);
  invoice.set("metadata[product]", "alwahhub");
  invoice.set("metadata[methods]", "mada,applepay");

  const response = await fetch("https://api.moyasar.com/v1/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: invoice,
  });

  const payload = (await response.json()) as {
    url?: string;
    message?: string;
  };
  if (!response.ok || !payload.url) {
    return {
      ok: false,
      status: 502,
      error:
        payload.message ??
        "تعذّر إنشاء فاتورة Moyasar. فعّل مدى و Apple Pay من لوحة البوابة.",
    };
  }
  return { ok: true, checkoutUrl: payload.url, provider: "moyasar" };
}

export function wantsRedirect(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  return (
    accept.includes("text/html") ||
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}
