import type { JSX } from "react";

import { PageHeader } from "@/components/page-header";
import { FilesystemPanel } from "@/features/filesystem/filesystem-panel";

/**
 * Filesystem feature: browse SPIFFS / LittleFS volumes on a connected board.
 */
export function FilesystemFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Filesystem"
        description="Browse SPIFFS / LittleFS contents on a connected board."
      />
      <FilesystemPanel />
    </div>
  );
}
