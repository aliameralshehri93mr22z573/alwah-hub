import type { Locale } from "@/lib/i18n";
import type { PlanTier } from "@/lib/plans";
import type { TemplateType } from "@/lib/templates";

export type TemplateLandingCopy = {
  heading: string;
  audience: string;
  title: string;
  description: string;
  columns: string[];
  sampleTask: string;
};

export const TEMPLATE_LANDING: Record<
  Locale,
  Record<TemplateType, TemplateLandingCopy>
> = {
  ar: {
    sales: {
      heading: "قالب الشركات والمبيعات",
      audience: "فرق المبيعات وإغلاق الصفقات",
      title: "مسار المبيعات",
      description: "متابعة العملاء من أول تواصل حتى إغلاق الصفقة.",
      columns: ["عميل محتمل", "جاري التفاوض", "فواتير معلقة", "مغلقة بنجاح"],
      sampleTask: "عرض سعر لشركة النور",
    },
    dev: {
      heading: "قالب البرمجة",
      audience: "فرق التطوير ودورات الـ Sprint",
      title: "لوحة البرمجة",
      description: "إدارة المهام التقنية عبر دورة الـ Sprint.",
      columns: ["قائمة المهام", "Sprint الحالي", "قيد الاختبار", "مكتمل"],
      sampleTask: "إعداد بيئة التطوير",
    },
    edu: {
      heading: "قالب التعليم",
      audience: "المعلمون ومتابعة الدروس",
      title: "لوحة التدريس",
      description: "تحضير الدروس ومتابعة الاختبارات.",
      columns: ["تجهيز الدرس", "بانتظار الشرح", "تم الاختبار"],
      sampleTask: "درس الكسور الاعتيادية",
    },
    wedding: {
      heading: "قالب المنزل والمناسبات",
      audience: "التجهيزات، الميزانية، والمشتريات",
      title: "لوحة المنزل والمناسبات",
      description: "تنظيم الأفكار، التجهيز، والمشتريات.",
      columns: ["أفكار", "قيد التجهيز", "تم الشراء"],
      sampleTask: "قائمة مستلزمات المناسبة",
    },
  },
  en: {
    sales: {
      heading: "Sales template",
      audience: "Sales teams and closing deals",
      title: "Sales Pipeline",
      description: "Follow leads from first contact to a closed deal.",
      columns: ["Lead", "Negotiating", "Pending invoices", "Closed won"],
      sampleTask: "Quote for Al-Noor Company",
    },
    dev: {
      heading: "Development template",
      audience: "Engineering teams and sprint cycles",
      title: "Development",
      description: "Move technical work through the sprint cycle.",
      columns: ["Backlog", "Current Sprint", "In QA", "Done"],
      sampleTask: "Set up the development environment",
    },
    edu: {
      heading: "Education template",
      audience: "Teachers and lesson follow-up",
      title: "Education",
      description: "Prepare lessons and track assessments.",
      columns: ["Lesson prep", "Ready to teach", "Assessed"],
      sampleTask: "Fractions lesson",
    },
    wedding: {
      heading: "Personal / Events template",
      audience: "Prep, budget, and purchases",
      title: "Personal / Events",
      description: "Organize ideas, prep, and purchases.",
      columns: ["Ideas", "In progress", "Purchased"],
      sampleTask: "Event supplies list",
    },
  },
};

export const PLAN_I18N: Record<
  Locale,
  Record<PlanTier, { name: string; tagline: string; features: string[] }>
> = {
  ar: {
    free: {
      name: "المجانية",
      tagline: "للتجربة والبداية الفردية.",
      features: [
        "حتى لوحتين",
        "حتى 3 أعضاء في المساحة",
        "حتى 50 مهمة نشطة",
        "قوالب عربية جاهزة",
      ],
    },
    solo: {
      name: "الأفراد",
      tagline: "للمستقلين وأصحاب المشاريع الصغيرة.",
      features: [
        "لوحات غير محدودة",
        "مهام غير محدودة",
        "مساحة فردية",
        "مدى و Apple Pay",
      ],
    },
    team: {
      name: "الفرق",
      tagline: "للتنسيق اليومي بين الزملاء.",
      features: [
        "لوحات غير محدودة",
        "حتى 10 أعضاء",
        "تقارير المساحة",
        "مزامنة مباشرة للفريق",
      ],
    },
    agency: {
      name: "المنشآت",
      tagline: "للوكالات والفرق متعددة المساحات.",
      features: [
        "لوحات وأعضاء بلا حد عملي",
        "تقارير متقدمة",
        "أولوية في الدعم",
        "مدى و Apple Pay للمنشأة",
      ],
    },
  },
  en: {
    free: {
      name: "Free",
      tagline: "For trying the product on your own.",
      features: [
        "Up to 2 boards",
        "Up to 3 workspace members",
        "Up to 50 active tasks",
        "Ready Arabic templates",
      ],
    },
    solo: {
      name: "Solo",
      tagline: "For freelancers and small projects.",
      features: [
        "Unlimited boards",
        "Unlimited tasks",
        "Personal workspace",
        "Mada and Apple Pay",
      ],
    },
    team: {
      name: "Team",
      tagline: "For daily coordination with colleagues.",
      features: [
        "Unlimited boards",
        "Up to 10 members",
        "Workspace reports",
        "Realtime team sync",
      ],
    },
    agency: {
      name: "Agency",
      tagline: "For agencies and multi-workspace teams.",
      features: [
        "Boards and members with no practical cap",
        "Advanced reports",
        "Priority support",
        "Mada and Apple Pay for the org",
      ],
    },
  },
};

export const MARKETING_UI = {
  ar: {
    tryTemplate: "جرّب القالب",
    column: (index: number) => `عمود ${index}`,
    previewNote: "الأعمدة جاهزة من أول يوم، والحقول العربية تظهر داخل كل مهمة.",
    mostChosen: "الأكثر اختياراً",
    startFree: "ابدأ مجاناً",
    upgrade: "ترقية",
    currentPlan: "باقتك الحالية",
    payHint: "الدفع عبر مدى والبطاقات و Apple Pay",
    currencyZero: "ر.س",
    currencyMonth: "ر.س / شهرياً",
    heroBoardTitle: "مسار المبيعات",
    heroBoardBadge: "عربي · RTL",
    heroBoardFooter: "مدى و Apple Pay داخل نفس المساحة",
    heroTasks: [
      "عرض سعر لشركة النور",
      "متابعة عميل الأحساء",
      "اتفاق على بنود العقد",
      "توقيع باقة الفرق",
    ],
  },
  en: {
    tryTemplate: "Try template",
    column: (index: number) => `Column ${index}`,
    previewNote: "Columns are ready from day one, and fields appear inside each task.",
    mostChosen: "Most popular",
    startFree: "Start Free",
    upgrade: "Upgrade",
    currentPlan: "Current plan",
    payHint: "Pay with Mada, cards, and Apple Pay",
    currencyZero: "SAR",
    currencyMonth: "SAR / month",
    heroBoardTitle: "Sales Pipeline",
    heroBoardBadge: "Arabic · RTL",
    heroBoardFooter: "Mada and Apple Pay in the same workspace",
    heroTasks: [
      "Quote for Al-Noor Company",
      "Follow up with the Al-Ahsa client",
      "Agree on contract terms",
      "Sign the Team plan",
    ],
  },
} as const;
