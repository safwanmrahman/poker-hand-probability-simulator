import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-[#fffefb] px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-stone-500 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:bg-[#f6efe5] disabled:text-stone-500 dark:bg-slate-950/55 dark:placeholder:text-muted-foreground dark:disabled:bg-slate-950/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
