import type { JSX } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import type { DeviceSnapshot } from "@/store";

type DeviceDiscoveryPanelProps = {
  webSerialSupported: boolean | null;
  isConnecting: boolean;
  isIdentifying?: boolean;
  identifyError?: string | null;
  activeDevice: DeviceSnapshot | null;
  errorKind:
    | "unsupported"
    | "cancelled"
    | "failed"
    | "disconnect"
    | "lost"
    | null;
  errorMessage: string | null;
  onIdentify?: (() => void) | undefined;
  onRetryConnect?: (() => void) | undefined;
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
  isIdentifying = false,
  identifyError = null,
  activeDevice,
  errorKind,
  errorMessage,
  onIdentify,
  onRetryConnect,
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
          <AlertDescription className="space-y-3">
            <p>
              {errorMessage ??
                "The serial port chooser was closed without selecting a device."}
            </p>
            {onRetryConnect ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isConnecting}
                onClick={onRetryConnect}
              >
                Try again
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "failed" ? (
        <Alert variant="destructive">
          <AlertTitle>Connection failed</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {errorMessage ??
                "ESP Studio could not open the selected serial port."}
            </p>
            {onRetryConnect ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isConnecting}
                onClick={onRetryConnect}
              >
                Retry
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "lost" ? (
        <Alert variant="warning">
          <AlertTitle>Device disconnected</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {errorMessage ??
                "The serial device was disconnected unexpectedly. Reconnect to continue."}
            </p>
            {onRetryConnect ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isConnecting}
                onClick={onRetryConnect}
              >
                Reconnect
              </Button>
            ) : null}
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

      {identifyError ? (
        <Alert variant="destructive">
          <AlertTitle>Identification failed</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{identifyError}</p>
            {onIdentify ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isIdentifying || isConnecting || !activeDevice}
                onClick={onIdentify}
              >
                Retry identify
              </Button>
            ) : null}
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

      {isIdentifying ? (
        <Card>
          <CardHeader>
            <CardTitle>Identifying chip</CardTitle>
            <CardDescription>
              Reading chip identity over the serial connection…
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  activeDevice.status === "connected" ? "success" : "secondary"
                }
              >
                {activeDevice.status}
              </Badge>
              {onIdentify ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isIdentifying || isConnecting}
                  onClick={onIdentify}
                >
                  {isIdentifying ? "Identifying…" : "Identify"}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Chip</dt>
                <dd className="text-sm font-medium">
                  {formatChipLabel(activeDevice.chipFamily)}
                </dd>
              </div>
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

            <Alert variant="info">
              <AlertTitle>Serial port permissions</AlertTitle>
              <AlertDescription className="text-xs">
                Disconnect closes the port. Chrome still remembers grants for
                this site and may list the device again in the port chooser.
                Use <span className="font-medium">Forget port</span> to revoke
                this origin’s grant via{" "}
                <code className="font-mono">SerialPort.forget()</code>. ESP
                Studio cannot clear Chrome’s global device list.
              </AlertDescription>
            </Alert>
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
              the browser serial port chooser. After connecting, use Flash,
              Serial, or Filesystem from the sidebar.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
