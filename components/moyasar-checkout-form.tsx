"use client";

import Script from "next/script";
import { useCallback, useState } from "react";
import { CreditCard, ShieldCheck, Wallet } from "lucide-react";
import {
  MOYASAR_APPLE_PAY_VALIDATE_URL,
  MOYASAR_FORM_CSS,
  MOYASAR_FORM_JS,
} from "@/lib/moyasar";
import { planOf, type PlanTier } from "@/lib/plans";

export type MoyasarCheckoutConfig = {
  plan: Exclude<PlanTier, "free">;
  amountHalalas: number;
  userId: string;
  publishableKey: string;
  callbackUrl: string;
};

type MoyasarPaymentResult = {
  id?: string;
  status?: string;
};

type MoyasarInitConfig = {
  element: string | HTMLElement;
  amount: number;
  currency: string;
  description: string;
  publishable_api_key: string;
  callback_url: string;
  language: "ar" | "en";
  methods: Array<"creditcard" | "applepay">;
  supported_networks: Array<"mada" | "visa" | "mastercard">;
  metadata: Record<string, string>;
  statement_descriptor: string;
  apple_pay: {
    country: string;
    label: string;
    validate_merchant_url: string;
    supported_countries: string[];
  };
  on_completed?: (payment: MoyasarPaymentResult) => void | Promise<void>;
  on_failure?: (error: string) => void | Promise<void>;
  on_redirect?: (url: string) => void | Promise<void>;
};

declare global {
  interface Window {
    Moyasar?: {
      init: (config: MoyasarInitConfig) => void;
    };
  }
}

function PaymentMethodBadges() {
  return (
    <ul className="flex flex-wrap gap-2 text-xs">
      <li className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
        <CreditCard className="size-3.5 text-accent" />
        مدى
      </li>
      <li className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
        <CreditCard className="size-3.5 text-accent" />
        Visa / Mastercard
      </li>
      <li className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
        <Wallet className="size-3.5 text-accent" />
        Apple Pay
      </li>
    </ul>
  );
}

function successUrl(paymentId: string, status?: string) {
  const target = new URL("/billing/success", window.location.origin);
  target.searchParams.set("payment_id", paymentId);
  if (status) {
    target.searchParams.set("status", status);
  }
  return target.toString();
}

export function MoyasarCheckoutForm({ config }: { config: MoyasarCheckoutConfig }) {
  const plan = planOf(config.plan);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const initForm = useCallback(() => {
    const mount = document.getElementById("moyasar-form");
    if (!mount || !window.Moyasar) {
      setError("تعذّر تحميل نموذج Moyasar. حدّث الصفحة ثم أعد المحاولة.");
      return;
    }

    mount.replaceChildren();
    setError(null);
    window.Moyasar.init({
      element: mount,
      amount: config.amountHalalas,
      currency: "SAR",
      description: `اشتراك ألواح هب — ${plan.name}`,
      publishable_api_key: config.publishableKey,
      callback_url: config.callbackUrl,
      language: "ar",
      methods: ["creditcard", "applepay"],
      supported_networks: ["mada", "visa", "mastercard"],
      metadata: {
        user_id: config.userId,
        plan: config.plan,
        product: "alwahhub",
      },
      statement_descriptor: "AlwahHub",
      apple_pay: {
        country: "SA",
        label: "ألواح هب",
        validate_merchant_url: MOYASAR_APPLE_PAY_VALIDATE_URL,
        supported_countries: ["SA"],
      },
      on_completed: async (payment) => {
        if (payment.id && payment.status === "paid") {
          window.location.assign(successUrl(payment.id, payment.status));
        }
      },
      on_failure: async (message) => {
        setError(message || "تعذّر إكمال الدفع. تحقق من البطاقة ثم أعد المحاولة.");
      },
      on_redirect: async (url) => {
        try {
          const parsed = new URL(url, window.location.origin);
          const paymentId =
            parsed.searchParams.get("id") ??
            parsed.searchParams.get("payment_id");
          if (paymentId) {
            window.location.assign(
              successUrl(paymentId, parsed.searchParams.get("status") ?? ""),
            );
            return;
          }
        } catch {
          // Fall through to Moyasar's URL.
        }
        window.location.assign(url);
      },
    });
    setReady(true);
  }, [config, plan.name]);

  if (!config.publishableKey) {
    return (
      <div className="space-y-4">
        <PaymentMethodBadges />
        <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm leading-7 text-amber-50">
          لم يُضبط المفتاح العام{" "}
          <span dir="ltr" className="font-mono text-accent">
            NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY
          </span>
          . أضفه في{" "}
          <span dir="ltr" className="font-mono">
            .env.local
          </span>{" "}
          ثم أعد تشغيل الخادم لتظهر بطاقات مدى وفيزا وماستركارد و Apple Pay.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <link rel="stylesheet" href={MOYASAR_FORM_CSS} />
      <Script
        id="moyasar-payment-form"
        src={MOYASAR_FORM_JS}
        strategy="afterInteractive"
        onReady={initForm}
        onError={() =>
          setError("تعذّر تحميل مكتبة Moyasar من شبكة التوزيع.")
        }
      />

      <PaymentMethodBadges />

      <div className="overflow-hidden rounded-3xl bg-white p-4 text-slate-900 shadow-xl shadow-black/20 sm:p-5">
        {!ready && !error ? (
          <p className="py-10 text-center text-sm text-slate-500">
            جارٍ تجهيز نموذج الدفع...
          </p>
        ) : null}
        <div id="moyasar-form" className="mysr-form" />
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <p className="flex items-start gap-2 text-xs leading-6 text-slate-400">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
        الدفع مشفّر عبر Moyasar. Apple Pay يظهر على Safari والأجهزة المدعومة،
        وبطاقات مدى والبطاقات الائتمانية متاحة دائماً.
      </p>
    </div>
  );
}
