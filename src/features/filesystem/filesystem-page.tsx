import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";

export function FilesystemFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Filesystem"
        description="Browse SPIFFS / LittleFS contents on a connected board."
      />
      <FeaturePlaceholder
        title="Filesystem browser placeholder"
        description="File listing, upload, and download tools will appear here after device filesystem support is added."
      />
    </div>
  );
}
