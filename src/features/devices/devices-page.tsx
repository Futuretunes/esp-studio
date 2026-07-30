import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export function DevicesFeature(): JSX.Element {
  return (
    <div>
      <PageHeader
        title="Connect Device"
        description="Discover and connect ESP8266 or ESP32 boards from the browser."
        actions={
          <Button type="button" disabled>
            Connect
          </Button>
        }
      />
      <FeaturePlaceholder
        title="Device connection coming soon"
        description="Web Serial device discovery and connection management will live here. The connect flow is intentionally not implemented in this foundation."
      />
    </div>
  );
}
