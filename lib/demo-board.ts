import { buildCustomFields, BOARD_TEMPLATES } from "@/lib/templates";
import type { BoardData } from "@/lib/board-types";

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
