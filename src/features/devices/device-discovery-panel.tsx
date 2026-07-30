import type { JSX } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeviceSnapshot } from "@/store";

type DeviceDiscoveryPanelProps = {
  webSerialSupported: boolean | null;
  isConnecting: boolean;
  activeDevice: DeviceSnapshot | null;
  errorKind: "unsupported" | "cancelled" | "failed" | "disconnect" | null;
  errorMessage: string | null;
};

function capabilityEntries(
  capabilities: DeviceSnapshot["capabilities"],
): { label: string; enabled: boolean }[] {
  return [
    { label: "Serial", enabled: capabilities.serial },
    { label: "Flash", enabled: capabilities.flash },
    { label: "Filesystem", enabled: capabilities.filesystem },
    { label: "OTA", enabled: capabilities.ota },
    { label: "Baud control", enabled: capabilities.baudRateControl },
  ];
}

/**
 * Devices discovery status surface: support, errors, and connected metadata.
 */
export function DeviceDiscoveryPanel({
  webSerialSupported,
  isConnecting,
  activeDevice,
  errorKind,
  errorMessage,
}: DeviceDiscoveryPanelProps): JSX.Element {
  return (
    <div className="space-y-4">
      {webSerialSupported === false || errorKind === "unsupported" ? (
        <Alert variant="warning">
          <AlertTitle>Browser unsupported</AlertTitle>
          <AlertDescription>
            Web Serial is not available in this browser. Use a Chromium-based
            browser (Chrome, Edge, or Opera) over HTTPS or localhost to connect
            a device.
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "cancelled" ? (
        <Alert variant="info">
          <AlertTitle>No device selected</AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "The serial port chooser was closed without selecting a device."}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "failed" ? (
        <Alert variant="destructive">
          <AlertTitle>Connection failed</AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "ESP Studio could not open the selected serial port."}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "disconnect" ? (
        <Alert variant="destructive">
          <AlertTitle>Disconnect failed</AlertTitle>
          <AlertDescription>
            {errorMessage ?? "The serial port could not be closed cleanly."}
          </AlertDescription>
        </Alert>
      ) : null}

      {isConnecting ? (
        <Card>
          <CardHeader>
            <CardTitle>Connecting</CardTitle>
            <CardDescription>
              Waiting for the browser serial port chooser…
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ) : null}

      {activeDevice ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{activeDevice.name}</CardTitle>
              <CardDescription>
                {activeDevice.transportLabel ?? "Serial port"}
              </CardDescription>
            </div>
            <Badge
              variant={
                activeDevice.status === "connected" ? "success" : "secondary"
              }
            >
              {activeDevice.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Provider</dt>
                <dd className="text-sm font-medium">
                  {activeDevice.providerLabel}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  Connection status
                </dt>
                <dd className="text-sm font-medium">{activeDevice.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Chip family</dt>
                <dd className="text-sm font-medium">
                  {activeDevice.chipFamily}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Device id</dt>
                <dd className="truncate font-mono text-xs">
                  {activeDevice.id}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-muted-foreground mb-2 text-xs">Capabilities</p>
              <div className="flex flex-wrap gap-2">
                {capabilityEntries(activeDevice.capabilities).map((entry) => (
                  <Badge
                    key={entry.label}
                    variant={entry.enabled ? "secondary" : "outline"}
                    className={entry.enabled ? undefined : "opacity-50"}
                  >
                    {entry.label}
                    {entry.enabled ? "" : " (n/a)"}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!isConnecting &&
      !activeDevice &&
      webSerialSupported === true &&
      errorKind === null ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No device connected</CardTitle>
            <CardDescription>
              Click <span className="font-medium">Connect Device</span> to open
              the browser serial port chooser. Flashing and serial I/O are not
              part of this step.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
