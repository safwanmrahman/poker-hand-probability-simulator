import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border border-border bg-field px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] outline-none transition-[border-color,box-shadow,background-color,color] placeholder:text-stone-500 [color-scheme:light] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:bg-field-disabled disabled:text-[var(--color-control-disabled-foreground)] dark:placeholder:text-muted-foreground dark:[color-scheme:dark]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
