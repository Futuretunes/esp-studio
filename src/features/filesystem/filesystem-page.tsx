import type { JSX } from "react";

import { PageHeader } from "@/components/page-header";
import { FilesystemPanel } from "@/features/filesystem/filesystem-panel";

/**
 * Filesystem feature: browse and transfer SPIFFS / LittleFS files.
 */
export function FilesystemFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Filesystem"
        description="Browse, upload, and download files on a connected board’s SPIFFS or LittleFS volume."
      />
      <FilesystemPanel />
    </div>
  );
}
