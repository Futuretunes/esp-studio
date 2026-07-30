import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        destructive: "border-destructive/40 bg-destructive/10 text-destructive",
        warning:
          "border-amber-600/40 bg-amber-500/15 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
        info: "border-primary/30 bg-primary/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants>;

/**
 * Inline message for support, permission, and connection outcomes.
 */
function Alert({
  className,
  variant,
  ...props
}: AlertProps): React.JSX.Element {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

type AlertTitleProps = React.ComponentProps<"h5">;

function AlertTitle({
  className,
  ...props
}: AlertTitleProps): React.JSX.Element {
  return (
    <h5
      data-slot="alert-title"
      className={cn("mb-1 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

type AlertDescriptionProps = React.ComponentProps<"div">;

function AlertDescription({
  className,
  ...props
}: AlertDescriptionProps): React.JSX.Element {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
export type { AlertProps };
