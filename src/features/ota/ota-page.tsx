import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

export function OtaFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="OTA Updates"
        description="Push over-the-air firmware updates to networked ESP devices."
      />
      <FeaturePlaceholder
        title="OTA updates placeholder"
        description="Target discovery, update packaging, and progress tracking will be implemented in a later milestone."
      />
    </div>
  );
}
