import type { JSX } from "react";

import { PageHeader } from "@/components/page-header";
import { SerialMonitorPanel } from "@/features/serial/serial-monitor-panel";

/**
 * Serial Monitor feature page (minimal UTF-8 console).
 */
export function SerialFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Serial Monitor"
        description="Live serial output and send text to the connected board."
      />
      <SerialMonitorPanel />
    </div>
  );
}
