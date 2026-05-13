import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionTitleProps = {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
  icon: LucideIcon;
};

export function SectionTitle({
  children,
  className,
  iconClassName,
  icon: Icon,
}: SectionTitleProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Icon className={cn("size-4 shrink-0", iconClassName)} />
      <span className="leading-none">{children}</span>
    </span>
  );
}
