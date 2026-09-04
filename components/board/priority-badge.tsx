import type { TaskPriority } from "@/lib/board-types";
import { PRIORITY_LABELS } from "@/lib/board-types";

const STYLES: Record<TaskPriority, string> = {
  low: "bg-slate-500/20 text-slate-200",
  medium: "bg-sky-500/20 text-sky-100",
  high: "bg-amber-500/20 text-amber-100",
  urgent: "bg-rose-500/20 text-rose-100",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${STYLES[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
