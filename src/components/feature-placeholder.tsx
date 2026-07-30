import { Construction } from "lucide-react";
import type { JSX, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
  /** When false, hides the beta availability note. Defaults to true. */
  showBetaNote?: boolean;
};

export function FeaturePlaceholder({
  title,
  description,
  children,
  showBetaNote = true,
}: FeaturePlaceholderProps): JSX.Element {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-lg">
          <Construction className="size-5" aria-hidden />
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{description}</p>
        {children}
        {showBetaNote ? (
          <p className="bg-muted/60 text-muted-foreground rounded-md px-3 py-2 text-xs">
            Not available in this beta. Device, Flash, Serial, and Filesystem
            tools are ready from the sidebar.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
