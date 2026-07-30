import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

export function FirmwareFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Firmware Library"
        description="Organize local and remote firmware binaries for your projects."
      />
      <FeaturePlaceholder
        title="Firmware library placeholder"
        description="Manage firmware metadata, versions, and downloads from this module once storage and import flows are implemented."
      />
    </div>
  );
}
