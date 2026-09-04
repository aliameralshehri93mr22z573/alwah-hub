import { cookies } from "next/headers";
import { paidPlanFrom } from "@/lib/checkout-session";
import type { PlanTier } from "@/lib/plans";

export const DEMO_PLAN_COOKIE = "alwahhub_plan";
export const DEMO_BOARDS_COOKIE = "alwahhub_demo_boards";

export type DemoBoardRecord = {
  id: string;
  title: string;
  template_type: "custom";
  columns: { title: string }[];
};

export function isMoyasarConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY);
}

export function demoCookieOptions() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax" as const,
    httpOnly: true,
  };
}

export async function readDemoPlan(): Promise<Exclude<PlanTier, "free"> | null> {
  const jar = await cookies();
  return paidPlanFrom(jar.get(DEMO_PLAN_COOKIE)?.value);
}

export async function effectivePlan(
  stored: string | null | undefined,
): Promise<PlanTier> {
  if (stored === "solo" || stored === "team" || stored === "agency") {
    return stored;
  }
  if (!isMoyasarConfigured()) {
    return (await readDemoPlan()) ?? "free";
  }
  return "free";
}

function parseBoards(raw: string | undefined): DemoBoardRecord[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is DemoBoardRecord => {
      return Boolean(
        item &&
          typeof item === "object" &&
          typeof (item as DemoBoardRecord).id === "string" &&
          typeof (item as DemoBoardRecord).title === "string",
      );
    });
  } catch {
    return [];
  }
}

export async function readDemoBoards(): Promise<DemoBoardRecord[]> {
  const jar = await cookies();
  return parseBoards(jar.get(DEMO_BOARDS_COOKIE)?.value);
}

export function seedDemoBoards(): DemoBoardRecord[] {
  return [
    {
      id: `demo-${crypto.randomUUID()}`,
      title: "مسار المبيعات",
      template_type: "custom",
      columns: [
        { title: "عميل محتمل" },
        { title: "جاري التفاوض" },
        { title: "مغلقة بنجاح" },
      ],
    },
    {
      id: `demo-${crypto.randomUUID()}`,
      title: "مهام الفريق",
      template_type: "custom",
      columns: [{ title: "للتنفيذ" }, { title: "جارٍ" }, { title: "تم" }],
    },
  ];
}

export function newDemoBoard(index: number): DemoBoardRecord {
  return {
    id: `demo-${crypto.randomUUID()}`,
    title: `لوحة ${index}`,
    template_type: "custom",
    columns: [{ title: "للتنفيذ" }, { title: "جارٍ" }, { title: "تم" }],
  };
}
