import { buildCustomFields, BOARD_TEMPLATES } from "@/lib/templates";
import type { BoardData, WorkspaceMember } from "@/lib/board-types";

export const DEMO_MEMBERS: WorkspaceMember[] = [
  { id: "demo-user-1", full_name: "نورة العتيبي", email: "noura@example.com" },
  { id: "demo-user-2", full_name: "فهد الشمري", email: "fahd@example.com" },
];

export const DEMO_CURRENT_USER_ID = DEMO_MEMBERS[0].id;

export function createDemoBoard(): BoardData {
  const template = BOARD_TEMPLATES.sales;
  const now = new Date().toISOString();
  const boardId = "demo-board";

  const columns = template.columns.map((title, index) => {
    const columnId = `demo-col-${index}`;
    const tasks =
      index === 0
        ? [
            {
              id: "demo-task-1",
              column_id: columnId,
              title: template.sampleTask.title,
              description: template.sampleTask.description,
              priority: "high" as const,
              due_date: "2026-09-20",
              position: 0,
              custom_fields: {
                ...buildCustomFields(template),
                attachments: [
                  {
                    id: "demo-file-1",
                    name: "عرض السعر.pdf",
                    url: "https://example.com/quote.pdf",
                    added_at: now,
                  },
                ],
              },
              assigned_to: DEMO_MEMBERS[0].id,
              created_at: now,
            },
            {
              id: "demo-task-2",
              column_id: columnId,
              title: "متابعة عميل الاحساء",
              description: "اتصال ثانٍ بعد إرسال العرض.",
              priority: "medium" as const,
              due_date: "2026-09-12",
              position: 1,
              custom_fields: buildCustomFields(template),
              assigned_to: DEMO_MEMBERS[1].id,
              created_at: now,
            },
          ]
        : index === 1
          ? [
              {
                id: "demo-task-3",
                column_id: columnId,
                title: "تفاوض على الخصم",
                description: "انتظار موافقة الإدارة المالية.",
                priority: "urgent" as const,
                due_date: "2026-09-08",
                position: 0,
                custom_fields: buildCustomFields(template),
                assigned_to: null,
                created_at: now,
              },
            ]
          : [];

    return {
      id: columnId,
      board_id: boardId,
      title,
      position: index,
      created_at: now,
      tasks,
    };
  });

  return {
    id: boardId,
    title: template.title,
    template_type: template.type,
    columns,
  };
}
