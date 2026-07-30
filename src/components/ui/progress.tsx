import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentProps<"div"> & {
  /** Completion percentage from `0` to `100`. */
  value?: number;
};

/**
 * Simple shadcn-style progress bar (no Radix dependency).
 */
function Progress({
  className,
  value = 0,
  ...props
}: ProgressProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        "bg-secondary relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${String(clamped)}%` }}
      />
    </div>
  );
}

export { Progress };
