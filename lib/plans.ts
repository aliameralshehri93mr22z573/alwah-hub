export const PLAN_TIERS = ["free", "solo", "team", "agency"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

export type PlanLimits = {
  maxBoards: number | null;
  maxMembers: number | null;
  maxActiveTasks: number | null;
  reports: boolean;
};

export type PlanDefinition = {
  id: PlanTier;
  name: string;
  tagline: string;
  monthlySar: number;
  amountHalalas: number;
  highlighted?: boolean;
  features: string[];
  limits: PlanLimits;
};

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free",
    name: "المجانية",
    tagline: "للتجربة والبداية الفردية.",
    monthlySar: 0,
    amountHalalas: 0,
    features: [
      "حتى لوحتين",
      "حتى 3 أعضاء في المساحة",
      "حتى 50 مهمة نشطة",
      "قوالب عربية جاهزة",
    ],
    limits: {
      maxBoards: 2,
      maxMembers: 3,
      maxActiveTasks: 50,
      reports: false,
    },
  },
  solo: {
    id: "solo",
    name: "الأفراد",
    tagline: "للمستقلين وأصحاب المشاريع الصغيرة.",
    monthlySar: 39,
    amountHalalas: 3900,
    features: [
      "لوحات غير محدودة",
      "مهام غير محدودة",
      "مساحة فردية",
      "مدى و Apple Pay",
    ],
    limits: {
      maxBoards: null,
      maxMembers: 1,
      maxActiveTasks: null,
      reports: false,
    },
  },
  team: {
    id: "team",
    name: "الفرق",
    tagline: "للتنسيق اليومي بين الزملاء.",
    monthlySar: 149,
    amountHalalas: 14900,
    highlighted: true,
    features: [
      "لوحات غير محدودة",
      "حتى 10 أعضاء",
      "تقارير المساحة",
      "مزامنة مباشرة للفريق",
    ],
    limits: {
      maxBoards: null,
      maxMembers: 10,
      maxActiveTasks: null,
      reports: true,
    },
  },
  agency: {
    id: "agency",
    name: "المنشآت",
    tagline: "للوكالات والفرق متعددة المساحات.",
    monthlySar: 349,
    amountHalalas: 34900,
    features: [
      "لوحات وأعضاء بلا حد عملي",
      "تقارير متقدمة",
      "أولوية في الدعم",
      "مدى و Apple Pay للمنشأة",
    ],
    limits: {
      maxBoards: null,
      maxMembers: null,
      maxActiveTasks: null,
      reports: true,
    },
  },
};

export const PAID_PLANS = [PLANS.solo, PLANS.team, PLANS.agency] as const;

export function isPlanTier(value: string): value is PlanTier {
  return PLAN_TIERS.includes(value as PlanTier);
}

export function planOf(tier: string | null | undefined): PlanDefinition {
  return isPlanTier(tier ?? "") ? PLANS[tier as PlanTier] : PLANS.free;
}
