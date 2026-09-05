export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "alwahhub_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ar" || value === "en";
}

export function localeDir(locale: Locale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

export function localeLang(locale: Locale): "ar" | "en" {
  return locale;
}

export type LandingCopy = {
  navTemplates: string;
  navPricing: string;
  navFaq: string;
  navLogin: string;
  navStart: string;
  navDemo: string;
  openMenu: string;
  closeMenu: string;
  brand: string;
  heroBadge: string;
  heroTitle: string;
  heroBody: string;
  heroCta: string;
  heroDemo: string;
  badgeArabic: string;
  badgePay: string;
  badgeFast: string;
  cardSpeedTitle: string;
  cardSpeedBody: string;
  cardPriceTitle: string;
  cardPriceBody: string;
  cardMobileTitle: string;
  cardMobileBody: string;
  templatesKicker: string;
  templatesTitle: string;
  templatesBody: string;
  pricingKicker: string;
  pricingTitle: string;
  pricingBody: string;
  faqKicker: string;
  faqTitle: string;
  footerBlurb: string;
  footerPlatform: string;
  footerLegal: string;
  footerTemplates: string;
  footerPricing: string;
  footerDemo: string;
  footerRegister: string;
  footerTerms: string;
  footerPrivacy: string;
  footerRights: string;
  faqs: { id: string; question: string; answer: string }[];
};

export const LANDING: Record<Locale, LandingCopy> = {
  ar: {
    navTemplates: "القوالب",
    navPricing: "الأسعار",
    navFaq: "الأسئلة",
    navLogin: "دخول",
    navStart: "ابدأ مجاناً",
    navDemo: "مشاهدة عرض تجريبي",
    openMenu: "فتح القائمة",
    closeMenu: "إغلاق القائمة",
    brand: "ألواح هب",
    heroBadge: "عربي أصيل · مدى · Apple Pay",
    heroTitle: "مركزك الذكي لإدارة المهام والمشاريع بسلاسة عربية",
    heroBody:
      "أدوات مثل Monday وClickUp قوية، لكنها معقّدة وأسعارها مرتفعة وواجهتها ليست عربية من الأساس. ألواح هب تمنحك كانبان سريعاً من اليمين لليسار، قوالب جاهزة، ودفعاً محلياً بمدى وApple Pay — دون أن تضيع أسبوعاً في إعداد الأداة.",
    heroCta: "ابدأ مجاناً",
    heroDemo: "مشاهدة عرض تجريبي",
    badgeArabic: "عربي بالكامل",
    badgePay: "مدى و Apple Pay",
    badgeFast: "تبدأ خلال دقائق",
    cardSpeedTitle: "أسرع من إعداد الأدوات العالمية",
    cardSpeedBody: "مساحة و قالب ولوحة من أول تسجيل — بلا قوائم إنجليزية متداخلة.",
    cardPriceTitle: "أسعار أوضح بالريال",
    cardPriceBody: "من مجاني حتى 349 ر.س للمنشآت، بدون مفاجآت مقاعد مخفية.",
    cardMobileTitle: "مصمَّم للجوال أولاً",
    cardMobileBody:
      "ألواح تُمرّر أفقياً ومهام تُفتح من الأسفل كما يتوقع المستخدم.",
    templatesKicker: "القوالب الجاهزة",
    templatesTitle: "أربعة مسارات عربية تبدأ من أول نقرة",
    templatesBody:
      "اختر قالباً لترى أعمدته ومهمة نموذجية، ثم افتح العرض التجريبي وجرّب السحب والإفلات بنفسك.",
    pricingKicker: "الأسعار",
    pricingTitle: "باقات واضحة… وترقية فورية",
    pricingBody:
      "المجانية للتجربة، ثم الأفراد 39 ر.س، الفرق 149 ر.س، والمنشآت 349 ر.س شهرياً. زر الترقية ينقلك مباشرة لإتمام الدفع.",
    faqKicker: "الأسئلة الشائعة",
    faqTitle: "إجابات سريعة قبل أن تبدأ",
    footerBlurb:
      "منصة كانبان عربية لإدارة المهام والمشاريع، مع قوالب جاهزة ودفع محلي عبر مدى و Apple Pay.",
    footerPlatform: "المنصة",
    footerLegal: "قانوني",
    footerTemplates: "القوالب",
    footerPricing: "الأسعار",
    footerDemo: "العرض التجريبي",
    footerRegister: "إنشاء حساب",
    footerTerms: "شروط الاستخدام",
    footerPrivacy: "سياسة الخصوصية",
    footerRights: "© 2026 ألواح هب. جميع الحقوق محفوظة.",
    faqs: [
      {
        id: "payments",
        question: "ما طرق الدفع المحلية المتاحة؟",
        answer:
          "ندعم مدى، والبطاقات الائتمانية (Visa وMastercard)، وApple Pay عبر Moyasar. المبالغ بالريال السعودي، وبعد نجاح الدفع تُفعَّل الباقة فوراً على حسابك.",
      },
      {
        id: "export",
        question: "هل يمكنني تصدير بياناتي؟",
        answer:
          "بياناتك ملكك. يمكنك عرض المهام في وضع الجدول ونسخها عند الحاجة. إن احتجت ملفاً كاملاً للدعم أو الأرشفة تواصل معنا وسنوفّر لك نسخة من مساحة العمل.",
      },
      {
        id: "mobile",
        question: "هل تجربة الجوال مكتملة؟",
        answer:
          "نعم، الواجهة عربية من اليمين لليسار، وألواح كانبان تُمرّر أفقياً على الشاشة وتُفتح من الأسفل حتى تدير عملك بأسهل ما يمكن.",
      },
      {
        id: "arabic",
        question: "لماذا ألواح هب بدل Monday أو ClickUp؟",
        answer:
          "تلك الأدوات قوية لكنها معقّدة وغالباً أغلى، وواجهتها ليست عربية أصيلة. ألواح هب تبدأ خلال دقائق، بأسعار واضحة بالريال، ودفع محلي، دون أن تترجم قوائمك يدوياً كل يوم.",
      },
    ],
  },
  en: {
    navTemplates: "Templates",
    navPricing: "Pricing",
    navFaq: "FAQ",
    navLogin: "Log in",
    navStart: "Start free",
    navDemo: "View demo",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    brand: "AlwahHub",
    heroBadge: "Arabic-first · Mada · Apple Pay",
    heroTitle: "Your smart hub for tasks and projects — in Arabic, simply",
    heroBody:
      "Tools like Monday and ClickUp are powerful, but they are complex, expensive, and not Arabic-first. AlwahHub gives you a fast RTL kanban, ready templates, and local checkout with Mada and Apple Pay — without a week of setup.",
    heroCta: "Start free",
    heroDemo: "View demo",
    badgeArabic: "Fully Arabic",
    badgePay: "Mada & Apple Pay",
    badgeFast: "Ready in minutes",
    cardSpeedTitle: "Faster than setting up global tools",
    cardSpeedBody:
      "A workspace, template, and board from the first signup — no nested English menus.",
    cardPriceTitle: "Clearer prices in SAR",
    cardPriceBody:
      "From free up to 349 SAR for agencies, with no hidden seat surprises.",
    cardMobileTitle: "Mobile-first",
    cardMobileBody:
      "Boards swipe horizontally and tasks open from the bottom, as users expect.",
    templatesKicker: "Ready templates",
    templatesTitle: "Four Arabic workflows from the first tap",
    templatesBody:
      "Pick a template to see its columns and a sample task, then open the demo and try drag and drop.",
    pricingKicker: "Pricing",
    pricingTitle: "Clear plans… instant upgrade",
    pricingBody:
      "Free to try, then Solo 39 SAR, Team 149 SAR, and Agency 349 SAR per month. Upgrade takes you straight to checkout.",
    faqKicker: "FAQ",
    faqTitle: "Quick answers before you start",
    footerBlurb:
      "An Arabic kanban platform for tasks and projects, with ready templates and local payments via Mada and Apple Pay.",
    footerPlatform: "Product",
    footerLegal: "Legal",
    footerTemplates: "Templates",
    footerPricing: "Pricing",
    footerDemo: "Demo",
    footerRegister: "Create account",
    footerTerms: "Terms of use",
    footerPrivacy: "Privacy policy",
    footerRights: "© 2026 AlwahHub. All rights reserved.",
    faqs: [
      {
        id: "payments",
        question: "Which local payment methods are available?",
        answer:
          "We support Mada, Visa/Mastercard, and Apple Pay via Moyasar. Amounts are in Saudi Riyals, and your plan activates as soon as payment succeeds.",
      },
      {
        id: "export",
        question: "Can I export my data?",
        answer:
          "Your data is yours. You can view tasks in table mode and copy them when needed. If you need a full archive, contact us and we will provide a workspace copy.",
      },
      {
        id: "mobile",
        question: "Is the mobile experience complete?",
        answer:
          "Yes. The interface is Arabic right-to-left, kanban boards swipe horizontally, and tasks open from the bottom so you can run your work as easily as possible.",
      },
      {
        id: "arabic",
        question: "Why AlwahHub instead of Monday or ClickUp?",
        answer:
          "Those tools are powerful but often complex and more expensive, and they are not natively Arabic. AlwahHub starts in minutes, with clear SAR pricing and local payments, without translating menus every day.",
      },
    ],
  },
};

export const TASK_UI = {
  ar: {
    details: "تفاصيل المهمة",
    close: "إغلاق",
    closeDetails: "إغلاق التفاصيل",
    dragToClose: "اسحب للأسفل للإغلاق",
    translate: "ترجمة تجريبية",
    translateHint:
      "معاينة اختيارية لعنوان المهمة ووصفها وتعليقاتها. الربط بالذكاء الاصطناعي يأتي لاحقاً.",
    title: "العنوان",
    description: "الوصف",
    priority: "الأولوية",
    due: "تاريخ الاستحقاق",
    fields: "الحقول المخصصة",
    attachments: "المرفقات",
    delete: "حذف",
    attachmentName: "اسم المرفق",
    add: "إضافة",
    save: "حفظ التغييرات",
    comments: "التعليقات",
    commentsHint: "تعليقات تجريبية داخل المهمة — خطوة أولى قبل الربط لاحقاً.",
    commentAuthor1: "نورة",
    comment1: "أرسلت العرض للعميل.",
    commentAuthor2: "فهد",
    comment2: "ننتظر الرد قبل نهاية الأسبوع.",
  },
  en: {
    details: "Task details",
    close: "Close",
    closeDetails: "Close details",
    dragToClose: "Swipe down to close",
    translate: "Translation preview",
    translateHint:
      "Optional preview of the task title, description, and comments. AI translation will be wired later.",
    title: "Title",
    description: "Description",
    priority: "Priority",
    due: "Due date",
    fields: "Custom fields",
    attachments: "Attachments",
    delete: "Remove",
    attachmentName: "Attachment name",
    add: "Add",
    save: "Save changes",
    comments: "Comments",
    commentsHint: "Sample comments on this task — a first step before a later integration.",
    commentAuthor1: "Noura",
    comment1: "أرسلت العرض للعميل.",
    commentAuthor2: "Fahad",
    comment2: "ننتظر الرد قبل نهاية الأسبوع.",
  },
} as const;

export const APP_UI = {
  ar: {
    home: "الرئيسية",
    boards: "الألواح",
    reports: "التقارير",
    plans: "الباقات",
    mobileNav: "تنقل الجوال",
    dashboard: "لوحة التحكم",
    language: "اللغة",
  },
  en: {
    home: "Home",
    boards: "Boards",
    reports: "Reports",
    plans: "Plans",
    mobileNav: "Mobile navigation",
    dashboard: "Dashboard",
    language: "Language",
  },
} as const;
