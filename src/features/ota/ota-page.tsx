import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

export function OtaFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="OTA Updates"
        description="Over-the-air updates are not included in this beta. Use Flash over Web Serial to install firmware."
      />
      <FeaturePlaceholder
        title="Coming in a later release"
        description="Target discovery, packaging, and progress tracking are not available yet."
      />
    </div>
  );
}
