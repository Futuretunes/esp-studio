import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

/**
 * Firmware Library page placeholder.
 *
 * The reusable Firmware Catalog already powers Flash UI selection.
 * Browsing / one-click install from this page is a later milestone.
 */
export function FirmwareFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Firmware Library"
        description="Browse catalog providers and installable firmware packages."
      />
      <FeaturePlaceholder
        title="Firmware library deferred"
        description="The Firmware Catalog abstraction exists and Flash UI can select Local file…. Full library browsing, GitHub providers, and one-click install come later."
      />
    </div>
  );
}
