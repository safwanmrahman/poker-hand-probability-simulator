import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-stone-500 focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-950/55 dark:placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
