import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

export function SerialFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Serial Monitor"
        description="Inspect live serial output from connected devices."
      />
      <FeaturePlaceholder
        title="Serial monitor placeholder"
        description="Web Serial streaming, baud rate controls, and log buffering are deferred. This page is wired and ready for implementation."
      />
    </div>
  );
}
