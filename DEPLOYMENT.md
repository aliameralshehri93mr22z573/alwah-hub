# قائمة النشر — ألواح هب | AlwahHub

خمس خطوات مباشرة لنشر الإنتاج على Vercel.

## 1. المتغيرات البيئية في Vercel

انسخ القيم من `.env.local` إلى **Project → Settings → Environment Variables** (Production + Preview):

| المتغير | إلزامي | الغرض |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | نعم | رابط مشروع Supabase، مثل `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | نعم | المفتاح العام (anon) من Settings → API |
| `NEXT_PUBLIC_SITE_URL` | نعم | النطاق النهائي بدون شرطة أخيرة، مثل `https://alwahhub.vercel.app` أو النطاق المخصص |
| `SUPABASE_SERVICE_ROLE_KEY` | نعم | مفتاح `service_role` لتطبيق الباقة من الويب هوك فقط — لا تعرضه في الواجهة |
| `PAYMENT_PROVIDER` | نعم | `moyasar` (الافتراضي) أو `tap` |
| `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` | نعم للإنتاج | مفتاح Moyasar العام (`pk_live_...`) |
| `MOYASAR_SECRET_KEY` | نعم للإنتاج | المفتاح السري لبوابة Moyasar |
| `MOYASAR_WEBHOOK_SECRET` | نعم للإنتاج | سر توقيع الويب هوك |
| `PAYMENT_WEBHOOK_SECRET` | اختياري | سر إضافي يُقبل مع أسرار Moyasar/Tap |
| `TAP_SECRET_KEY` | إن اخترت Tap | مفتاح Tap السري |
| `TAP_WEBHOOK_SECRET` | إن اخترت Tap | سر ويب هوك Tap |

بدون `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` يعمل الدفع في وضع تجريبي محلي فقط، وهذا غير مناسب للإنتاج.

## 2. رفع الكود إلى مستودع GitHub خاص

1. أنشئ مستودعاً **Private** على GitHub باسم مناسب (مثلاً `alwah-hub`).
2. من جذر المشروع:

```bash
git init
git add .
git commit -m "Prepare AlwahHub for production."
git branch -M main
git remote add origin git@github.com:<your-user>/alwah-hub.git
git push -u origin main
```

3. لا ترفع `.env.local` ولا مفاتيح `service_role`. الملف `.gitignore` يستثني البيئة المحلية.

## 3. مشروع Supabase وسياسات RLS

- من [لوحة Supabase](https://supabase.com/dashboard) افتح المشروع وانسخ **Project URL** إلى `NEXT_PUBLIC_SUPABASE_URL`.
- نفّذ `supabase/schema.sql` كاملاً في SQL Editor إن لم يكن مطبّقاً بعد.
- تأكد أن **Row Level Security** مفعّل على: `profiles`، `workspaces`، `workspace_members`، `boards`، `columns`، `tasks`، و`billing_events`.
- السياسات في المخطط تقيّد الوصول لأعضاء مساحة العمل فقط. جدول `billing_events` بلا سياسات للعميل: القراءة/الكتابة تتم عبر `service_role` من الويب هوك.
- دالة `apply_billing_plan` ممنوحة لـ `service_role` فقط، ومشغّل `guard_profile_plan` يمنع المستخدم من تغيير باقته مباشرة من العميل.
- في Authentication → URL Configuration أضف Redirect URLs: `https://<نطاقك>/auth/callback` و`https://<نطاقك>/**`.

## 4. ربط Vercel والنشر

1. Import المستودع الخاص في [Vercel](https://vercel.com/new) (Framework Preset: Next.js).
2. الصق متغيرات الخطوة 1، ثم Deploy.
3. بعد ظهور النطاق اضبط `NEXT_PUBLIC_SITE_URL` على نفس الرابط وأعد النشر حتى تُبنى روابط Open Graph و`sitemap.xml` بشكل صحيح.
4. تحقق محلياً قبل الدفع: `npm run build`.

## 5. ويب هوك Moyasar بعد الإطلاق

في لوحة Moyasar أضف Webhook:

`https://<نطاقك>/api/billing/webhook`

فعّل أحداث `payment.paid` / `payment_paid` و`invoice.paid`، واستخدم نفس السر الموجود في `MOYASAR_WEBHOOK_SECRET`. بعد أول دفعة حقيقية تأكد أن الباقة تظهر في `profiles.plan` وأن سطراً أُضيف في `billing_events`.
