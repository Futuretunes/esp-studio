import type { JSX } from "react";
import { Link } from "react-router-dom";

import {
  deviceBusyAttemptOwner,
  type DeviceBusyAttempt,
} from "@/components/device-busy-attempt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  formatDeviceBusyMessage,
  formatDeviceOperationOwnerLabel,
} from "@/core/device";
import { useDeviceStore } from "@/store";

type DeviceBusyBannerProps = {
  /** Page context for tailored copy. */
  attempting?: DeviceBusyAttempt;
};

/**
 * Cross-page busy banner when **another** tool owns the connected device.
 *
 * Hidden when this page is the current owner so in-page progress UI is not
 * duplicated by a second busy alert.
 */
export function DeviceBusyBanner({
  attempting,
}: DeviceBusyBannerProps): JSX.Element | null {
  const operationOwner = useDeviceStore((state) => state.operationOwner);
  const activeDevice = useDeviceStore((state) => state.activeDevice);

  if (!activeDevice || operationOwner === null) {
    return null;
  }

  if (
    attempting !== undefined &&
    operationOwner === deviceBusyAttemptOwner(attempting)
  ) {
    return null;
  }

  const message = formatDeviceBusyMessage(operationOwner, attempting);
  const ownerLabel = formatDeviceOperationOwnerLabel(operationOwner);

  return (
    <Alert variant="warning">
      <AlertTitle>Device busy</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        <p className="text-muted-foreground text-xs">
          Current owner: {ownerLabel}
        </p>
        {operationOwner === "serial-monitor" ? (
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link to="/serial">Open Serial Monitor</Link>
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
