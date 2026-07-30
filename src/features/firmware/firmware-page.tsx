import type { JSX } from "react";
import { Link } from "react-router-dom";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

/**
 * Firmware Library page placeholder.
 *
 * Built-in catalog, GitHub provider, and one-click install already live on the
 * Flash page. This route remains a dedicated library browser milestone.
 */
export function FirmwareFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Firmware Library"
        description="Browse catalog providers and installable firmware packages."
      />
      <FeaturePlaceholder
        title="Dedicated library browser coming later"
        description="Flash already supports Built-in Catalog, GitHub releases, Local files, and one-click Install Firmware. A fuller library browser on this page is deferred."
      >
        <p className="text-sm">
          Use{" "}
          <Link to="/flash" className="underline underline-offset-4">
            Install Firmware
          </Link>{" "}
          for installs today.
        </p>
      </FeaturePlaceholder>
    </div>
  );
}
