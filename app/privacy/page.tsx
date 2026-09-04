import type { Metadata } from "next";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold">سياسة الخصوصية</h1>
        <p className="mt-4 text-sm leading-8 text-slate-300">
          نجمع البريد والاسم وبيانات المساحة اللازمة لتشغيل الحساب، وسجلات
          الدفع عبر مزوّد البوابة (مثل Moyasar) لتفعيل الباقة. لا نبيع بياناتك
          لأطراف تسويقية.
        </p>
        <p className="mt-4 text-sm leading-8 text-slate-300">
          تُستخدم ملفات تعريف الارتباط لجلسة الدخول ولحفظ باقة الوضع التجريبي
          على جهازك. يمكنك طلب حذف الحساب وبيانات المساحة المرتبطة به عبر
          التواصل مع الدعم.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
