import { Construction } from "lucide-react";
import type { JSX, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function FeaturePlaceholder({
  title,
  description,
  children,
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
        <p className="bg-muted/60 text-muted-foreground rounded-md px-3 py-2 text-xs">
          This feature is scaffolded and ready for implementation. Flashing and
          Web Serial are intentionally deferred.
        </p>
      </CardContent>
    </Card>
  );
}
