# ألواح هب | AlwahHub

منصة كانبان عربية (Next.js App Router + TypeScript + Tailwind + Supabase).

## التشغيل على الهاردسك الخارجي

كاش npm والمشروع يعيشان على قسم `alwah-hub` في هاردسك Seagate.

```bash
export npm_config_cache="/Volumes/alwah-hub/.npm-cache"
export TMPDIR="/Volumes/alwah-hub/.tmp"
cp .env.local.example .env.local
npm run dev
```

ثم نفّذ `supabase/schema.sql` داخل محرر SQL في مشروع Supabase.

للنشر على Vercel راجع [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## الباقات والدفع

- صفحة الترقية: `/pricing`
- صفحة الدفع: `/checkout?plan=solo|team|agency` (نموذج Moyasar: مدى، فيزا/ماستركارد، Apple Pay)
- بعد النجاح: `/billing/success?payment_id=...`
- ويب هوك البوابة: `POST /api/billing/webhook` (Moyasar أو Tap حسب `PAYMENT_PROVIDER`)

اضبط `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` و`MOYASAR_SECRET_KEY` و`PAYMENT_WEBHOOK_SECRET` أو `MOYASAR_WEBHOOK_SECRET` و`SUPABASE_SERVICE_ROLE_KEY`، ثم أضف عنوان الويب هوك في لوحة Moyasar مع أحداث `payment.paid` / `payment_paid` و`invoice.paid`.
