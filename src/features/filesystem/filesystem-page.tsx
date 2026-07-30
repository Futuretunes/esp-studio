import type { JSX } from "react";

import { DeviceBusyBanner } from "@/components/device-busy-banner";
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
      <div className="mb-4">
        <DeviceBusyBanner attempting="filesystem" />
      </div>
      <FilesystemPanel />
    </div>
  );
}
