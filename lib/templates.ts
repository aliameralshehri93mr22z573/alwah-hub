export const TEMPLATE_TYPES = ["sales", "dev", "edu", "wedding"] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const DEFAULT_TEMPLATE: TemplateType = "sales";

export type TemplateField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  value: string | number | null;
  options?: string[];
};

export type BoardTemplate = {
  type: TemplateType;
  title: string;
  workspaceName: string;
  description: string;
  columns: string[];
  fields: TemplateField[];
  sampleTask: {
    title: string;
    description: string;
  };
};

export const BOARD_TEMPLATES: Record<TemplateType, BoardTemplate> = {
  sales: {
    type: "sales",
    title: "مسار المبيعات",
    workspaceName: "مساحة العمل",
    description: "متابعة العملاء من أول تواصل حتى إغلاق الصفقة.",
    columns: [
      "عميل محتمل",
      "جاري التفاوض",
      "فواتير معلقة",
      "مغلقة بنجاح",
    ],
    fields: [
      { key: "client_name", label: "اسم العميل", type: "text", value: "شركة النور" },
      { key: "deal_value", label: "قيمة الصفقة", type: "number", value: 12000 },
      {
        key: "channel",
        label: "قناة التواصل",
        type: "select",
        value: "بريد",
        options: ["بريد", "هاتف", "واتساب"],
      },
      { key: "expected_close", label: "تاريخ الإغلاق المتوقع", type: "date", value: null },
    ],
    sampleTask: {
      title: "عرض سعر لشركة النور",
      description: "مهمة تجريبية لحقول قالب العمل والمبيعات.",
    },
  },
  dev: {
    type: "dev",
    title: "لوحة البرمجة",
    workspaceName: "مساحة التطوير",
    description: "إدارة المهام التقنية عبر دورة الـ Sprint.",
    columns: ["قائمة المهام", "Sprint الحالي", "قيد الاختبار", "مكتمل"],
    fields: [
      { key: "story_points", label: "نقاط القصة", type: "number", value: 3 },
      { key: "repo", label: "المستودع", type: "text", value: "alwah-hub" },
      {
        key: "priority_label",
        label: "أولوية تقنية",
        type: "select",
        value: "P2",
        options: ["P1", "P2", "P3"],
      },
      { key: "assignee", label: "المسؤول", type: "text", value: "" },
    ],
    sampleTask: {
      title: "إعداد بيئة التطوير",
      description: "مهمة تجريبية لحقول قالب البرمجة.",
    },
  },
  edu: {
    type: "edu",
    title: "لوحة التدريس",
    workspaceName: "مساحة التعليم",
    description: "تحضير الدروس ومتابعة الاختبارات.",
    columns: ["تجهيز الدرس", "بانتظار الشرح", "تم الاختبار"],
    fields: [
      { key: "subject", label: "المادة", type: "text", value: "الرياضيات" },
      { key: "grade", label: "الصف", type: "text", value: "الثالث متوسط" },
      { key: "duration_minutes", label: "المدة بالدقائق", type: "number", value: 45 },
      { key: "exam_date", label: "موعد الاختبار", type: "date", value: null },
    ],
    sampleTask: {
      title: "درس الكسور الاعتيادية",
      description: "مهمة تجريبية لحقول قالب التدريس والتعليم.",
    },
  },
  wedding: {
    type: "wedding",
    title: "لوحة المنزل والمناسبات",
    workspaceName: "مساحة المنزل",
    description: "تنظيم الأفكار، التجهيز، والمشتريات.",
    columns: ["أفكار", "قيد التجهيز", "تم الشراء"],
    fields: [
      { key: "budget", label: "الميزانية", type: "number", value: 500 },
      { key: "vendor", label: "المورّد", type: "text", value: "" },
      { key: "event_date", label: "تاريخ المناسبة", type: "date", value: null },
      { key: "guest_count", label: "عدد الضيوف", type: "number", value: 0 },
    ],
    sampleTask: {
      title: "قائمة مستلزمات المناسبة",
      description: "مهمة تجريبية لحقول قالب المنزل والمناسبات.",
    },
  },
};

export const TEMPLATE_LIST = TEMPLATE_TYPES.map((type) => BOARD_TEMPLATES[type]);

export function isTemplateType(value: string): value is TemplateType {
  return TEMPLATE_TYPES.includes(value as TemplateType);
}

export function buildCustomFields(template: BoardTemplate) {
  const values: Record<string, string | number | null> = {};
  for (const field of template.fields) {
    values[field.key] = field.value;
  }

  return {
    template: template.type,
    template_title: template.title,
    fields: template.fields,
    values,
  };
}
