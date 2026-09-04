import { Kanban } from "lucide-react";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/30">
        <Kanban className="size-5" aria-hidden />
      </span>
      <span className="text-lg font-bold leading-none">ألواح هب</span>
    </div>
  );
}
