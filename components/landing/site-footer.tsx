import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0B1224]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold">ألواح هب</p>
          <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">
            منصة كانبان عربية لإدارة المهام والمشاريع، مع قوالب جاهزة ودفع محلي
            عبر مدى و Apple Pay.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-accent">المنصة</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <a href="/#templates" className="hover:text-white">
                القوالب
              </a>
            </li>
            <li>
              <a href="/#pricing" className="hover:text-white">
                الأسعار
              </a>
            </li>
            <li>
              <Link href="/dashboard/boards/demo" className="hover:text-white">
                العرض التجريبي
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                إنشاء حساب
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-accent">قانوني</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <Link href="/terms" className="hover:text-white">
                شروط الاستخدام
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                سياسة الخصوصية
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:px-6">
          <span>© 2026 ألواح هب. جميع الحقوق محفوظة.</span>
          <span dir="ltr">AlwahHub</span>
        </p>
      </div>
    </footer>
  );
}
