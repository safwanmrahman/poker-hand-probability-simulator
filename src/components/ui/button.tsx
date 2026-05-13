import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-[0_16px_32px_-24px_rgba(17,48,42,0.8)] hover:-translate-y-0.5 hover:bg-primary/94 disabled:border-border disabled:bg-control-disabled disabled:text-control-disabled-foreground disabled:shadow-none",
        outline:
          "border border-border bg-card text-foreground shadow-[0_10px_18px_-18px_rgba(29,20,12,0.35)] hover:bg-muted/75 disabled:bg-field-disabled disabled:text-control-disabled-foreground disabled:shadow-none",
        secondary:
          "bg-secondary text-white hover:-translate-y-0.5 hover:bg-secondary/92 disabled:bg-control-disabled disabled:text-control-disabled-foreground",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
