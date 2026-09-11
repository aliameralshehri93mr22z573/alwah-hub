"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TicketPercent } from "lucide-react";
import { applyPromoCode } from "@/app/promo/actions";

export function PromoCodeForm({
  onApplied,
}: {
  onApplied?: () => void;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await applyPromoCode(code);
    setPending(false);
    setOk(result.ok);
    setMessage(result.message);
    if (result.ok) {
      router.refresh();
      onApplied?.();
      window.setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <TicketPercent className="size-4 text-accent" />
        كود الخصم للمدارس
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="أدخل كود الخصم"
          autoComplete="off"
          className="min-h-11 flex-1 rounded-full border border-white/10 bg-black/20 px-4 text-sm outline-none ring-brand focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "جارٍ التطبيق…" : "تطبيق"}
        </button>
      </form>
      {message ? (
        <p
          className={`mt-3 text-sm leading-6 ${
            ok ? "text-accent" : "text-red-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
