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
        description="Live UTF-8 serial output and text send over CommunicationSession ownership."
      />
      <SerialMonitorPanel />
    </div>
  );
}
