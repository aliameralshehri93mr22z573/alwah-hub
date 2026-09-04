"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Mail, RectangleEllipsis } from "lucide-react";
import { safeInternalPath } from "@/lib/paths";
import { toArabicAuthError } from "@/lib/auth-errors";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/env";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
};

type AuthMethod = "password" | "magic";

function callbackUrl(nextPath: string) {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const destination = safeInternalPath(nextPath);
  const [method, setMethod] = useState<AuthMethod>("password");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const configured = useMemo(() => isSupabaseConfigured(), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    try {
      if (!configured) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE");
      }

      const supabase = createClient();
      const emailRedirectTo = callbackUrl(destination);

      if (method === "magic") {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo,
            shouldCreateUser: mode === "register",
            data:
              mode === "register" && fullName
                ? { full_name: fullName }
                : undefined,
          },
        });
        if (otpError) {
          throw otpError;
        }
        setNotice("تم إرسال رابط الدخول إلى بريدك. افتح الرسالة للمتابعة.");
        return;
      }

      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo,
          },
        });
        if (signUpError) {
          throw signUpError;
        }
        if (!data.session) {
          setNotice(
            "تم إنشاء الحساب. أكّد بريدك أو افتح رابط الدخول لإكمال التهيئة.",
          );
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      }

      router.push(destination);
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "تعذر إكمال العملية الآن.";
      setError(toArabicAuthError(message));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMethod("password")}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 transition ${
            method === "password" ? "bg-brand text-white" : "text-slate-300"
          }`}
        >
          <RectangleEllipsis className="size-4" aria-hidden />
          كلمة المرور
        </button>
        <button
          type="button"
          onClick={() => setMethod("magic")}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 transition ${
            method === "magic" ? "bg-brand text-white" : "text-slate-300"
          }`}
        >
          <Mail className="size-4" aria-hidden />
          رابط سريع
        </button>
      </div>

      {mode === "register" ? (
        <label className="block text-sm">
          <span className="mb-1.5 block text-slate-200">الاسم الكامل</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-brand focus:ring-2"
            autoComplete="name"
          />
        </label>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1.5 block text-slate-200">البريد الإلكتروني</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-brand focus:ring-2"
          autoComplete="email"
          dir="ltr"
        />
      </label>

      {method === "password" ? (
        <label className="block text-sm">
          <span className="mb-1.5 block text-slate-200">كلمة المرور</span>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none ring-brand focus:ring-2"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            dir="ltr"
          />
        </label>
      ) : (
        <p className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-slate-200">
          سنرسل رابط دخول فورياً إلى بريدك بدون كلمة مرور.
        </p>
      )}

      {error ? (
        <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-xl bg-accent/15 px-3 py-2 text-sm text-sky-100">
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand py-3 font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
      >
        {pending
          ? "جارٍ التنفيذ..."
          : method === "magic"
            ? "أرسل رابط الدخول"
            : mode === "login"
              ? "دخول"
              : "إنشاء الحساب"}
      </button>

      <p className="text-center text-sm text-slate-300">
        {mode === "login" ? (
          <>
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-accent hover:underline">
              إنشاء حساب
            </Link>
          </>
        ) : (
          <>
            لديك حساب؟{" "}
            <Link href="/login" className="text-accent hover:underline">
              تسجيل الدخول
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
