import type { Metadata } from "next";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
};

export default function TermsPage() {
  return (
    <div className="min-h-full">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold">شروط الاستخدام</h1>
        <p className="mt-4 text-sm leading-8 text-slate-300">
          باستخدامك ألواح هب فإنك توافق على استخدام المنصة لإدارة مهامك
          ومشاريعك بطريقة مشروعة. الحساب مسؤوليتك، ولا تشارك كلمة المرور مع
          غيرك. الباقات المدفوعة تُفعَّل بعد نجاح الدفع عبر البوابة المعتمدة،
          ويمكن إيقاف الترقية التجريبية أو الاشتراك وفق ما يظهر في حسابك.
        </p>
        <p className="mt-4 text-sm leading-8 text-slate-300">
          نحتفظ بحق إيقاف الحسابات التي تسيء للمنصة أو تحاول الوصول غير
          المصرّح به. المحتوى الذي تدخله يبقى ملكك، وأنت تمنحنا ترخيصاً فنياً
          لتخزينه وعرضه داخل مساحتك فقط.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
