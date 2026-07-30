import type { JSX, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DiagnosticsCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Shared diagnostics section card.
 */
export function DiagnosticsCard({
  title,
  description,
  children,
  className,
}: DiagnosticsCardProps): JSX.Element {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type DiagnosticsFieldProps = {
  label: string;
  value: ReactNode;
  mono?: boolean;
};

/**
 * Label / value pair used inside diagnostics cards.
 */
export function DiagnosticsField({
  label,
  value,
  mono = false,
}: DiagnosticsFieldProps): JSX.Element {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        className={cn(
          "text-sm font-medium break-all",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Displays a value or a muted “Not available” placeholder.
 *
 * @param value - Presentable string, or null/empty
 */
export function diagnosticsDisplayValue(
  value: string | null | undefined,
): string {
  if (value === null || value === undefined || value.length === 0) {
    return "Not available";
  }
  return value;
}

type ConnectionBadgeProps = {
  status: string;
};

/**
 * Badge for connection / Web Serial status strings.
 */
export function DiagnosticsStatusBadge({
  status,
}: ConnectionBadgeProps): JSX.Element {
  const normalized = status.toLowerCase();
  const variant =
    normalized === "connected" ||
    normalized === "available" ||
    normalized === "true" ||
    normalized === "yes"
      ? "success"
      : normalized === "error" ||
          normalized === "unavailable" ||
          normalized === "false" ||
          normalized === "lost" ||
          normalized === "failed"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{status}</Badge>;
}
