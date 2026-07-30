import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

export function FlashFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Flash Firmware"
        description="Write firmware images to a connected ESP board."
      />
      <FeaturePlaceholder
        title="Flashing deferred"
        description="Firmware flashing UI and esptool-compatible workflows will be added later. No flashing logic is included in this foundation."
      />
    </div>
  );
}
