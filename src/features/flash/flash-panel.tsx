import type { ChangeEvent, JSX, RefObject } from "react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatFlashAddress } from "@/features/flash/format-flash-address";
import { formatFirmwareSize } from "@/features/flash/format-firmware-size";
import type { FlashProgress } from "@/features/flash/FlashProgress";
import type { FlashResult } from "@/features/flash/FlashResult";
import {
  catalogSelectionKey,
  type FlashUiErrorKind,
} from "@/features/flash/use-flash-workflow";
import type { FirmwareCatalogEntry } from "@/features/firmware/FirmwareProvider";
import type { FirmwareImage } from "@/features/firmware/FirmwareImage";
import type { FirmwareResolvedPackage } from "@/features/firmware/FirmwareProvider";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import { cn } from "@/lib/utils";
import type { DeviceSnapshot } from "@/store";

type FlashPanelProps = {
  activeDevice: DeviceSnapshot | null;
  webSerialSupported: boolean | null;
  catalogEntries: readonly FirmwareCatalogEntry[];
  selectionKey: string;
  resolved: FirmwareResolvedPackage | null;
  primaryImage: FirmwareImage | null;
  isFlashing: boolean;
  progress: FlashProgress | null;
  result: FlashResult | null;
  errorKind: FlashUiErrorKind;
  errorMessage: string | null;
  flashAddress: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSelectCatalogEntry: (key: string) => void;
  onSelectFile: (file: File | null) => void;
  onClearFile: () => void;
  onFlash: () => void;
};

function stageLabel(stage: FlashProgress["stage"]): string {
  switch (stage) {
    case "preparing":
      return "Preparing";
    case "connecting":
      return "Connecting";
    case "erasing":
      return "Erasing";
    case "writing":
      return "Writing";
    case "verifying":
      return "Verifying";
    case "resetting":
      return "Resetting";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
  }
}

/**
 * Flash UI surface: device summary, catalog selection, progress, and result.
 */
export function FlashPanel({
  activeDevice,
  webSerialSupported,
  catalogEntries,
  selectionKey,
  resolved,
  primaryImage,
  isFlashing,
  progress,
  result,
  errorKind,
  errorMessage,
  flashAddress,
  fileInputRef,
  onSelectCatalogEntry,
  onSelectFile,
  onClearFile,
  onFlash,
}: FlashPanelProps): JSX.Element {
  const unsupported = webSerialSupported === false;
  const flashDisabled =
    unsupported ||
    isFlashing ||
    !activeDevice ||
    !primaryImage ||
    primaryImage.data.length === 0;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onSelectFile(file);
  };

  const handleCatalogChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectCatalogEntry(event.target.value);
  };

  return (
    <div className="space-y-4">
      {unsupported || errorKind === "unsupported" ? (
        <Alert variant="warning">
          <AlertTitle>Browser unsupported</AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "Web Serial is not available in this browser. Use a Chromium-based browser over HTTPS or localhost."}
          </AlertDescription>
        </Alert>
      ) : null}

      {!activeDevice && !unsupported ? (
        <Alert variant="info">
          <AlertTitle>No device connected</AlertTitle>
          <AlertDescription>
            Connect a board on the{" "}
            <Link to="/devices" className="underline underline-offset-4">
              Devices
            </Link>{" "}
            page before flashing firmware.
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "no-file" || errorKind === "invalid-file" ? (
        <Alert variant="warning">
          <AlertTitle>
            {errorKind === "invalid-file" ? "Invalid file" : "No firmware selected"}
          </AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "Select firmware from the catalog (Local file…) to continue."}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "busy" ? (
        <Alert variant="destructive">
          <AlertTitle>Device busy</AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "Another tool owns the serial connection. Stop the Serial Monitor and try again."}
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "failed" || errorKind === "no-device" ? (
        <Alert variant="destructive">
          <AlertTitle>
            {errorMessage?.toLowerCase().includes("verif")
              ? "Verification failed"
              : "Flash failed"}
          </AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "The firmware could not be written. Check the cable and try again."}
          </AlertDescription>
        </Alert>
      ) : null}

      {result?.success === true ? (
        <Alert variant="info">
          <AlertTitle>Flash completed</AlertTitle>
          <AlertDescription>
            {result.message ??
              "Firmware was written, verified, and the device was reset."}
          </AlertDescription>
        </Alert>
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
          <CardContent>
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
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Firmware catalog</CardTitle>
          <CardDescription>
            Choose installable firmware from the catalog. MVP includes{" "}
            <span className="font-medium">Local file...</span> only. Images
            flash at{" "}
            <span className="font-mono text-xs">
              {formatFlashAddress(flashAddress)}
            </span>{" "}
            unless a future provider supplies another address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin,application/octet-stream"
            className="hidden"
            disabled={isFlashing || unsupported}
            onChange={handleFileChange}
          />

          <div className="space-y-2">
            <label
              htmlFor="firmware-catalog-select"
              className="text-muted-foreground text-xs"
            >
              Catalog entry
            </label>
            <select
              id="firmware-catalog-select"
              value={selectionKey}
              disabled={isFlashing || unsupported}
              onChange={handleCatalogChange}
              className={cn(
                "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">Select firmware…</option>
              {catalogEntries.map((entry) => {
                const key = catalogSelectionKey(
                  entry.manifest.providerId,
                  entry.manifest.id,
                );
                return (
                  <option key={key} value={key}>
                    {entry.manifest.title}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {resolved ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isFlashing}
                onClick={onClearFile}
              >
                Clear selection
              </Button>
            ) : null}
          </div>

          {resolved && primaryImage ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Firmware</dt>
                <dd className="truncate text-sm font-medium">
                  {resolved.manifest.title}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Source</dt>
                <dd className="text-sm font-medium">
                  {resolved.manifest.sourceKind}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Firmware size</dt>
                <dd className="text-sm font-medium">
                  {formatFirmwareSize(primaryImage.size)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Flash address</dt>
                <dd className="font-mono text-sm">
                  {formatFlashAddress(primaryImage.address)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">
              No firmware selected yet. Choose{" "}
              <span className="font-medium">Local file...</span> from the
              catalog.
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" disabled={flashDisabled} onClick={onFlash}>
            {isFlashing ? "Flashing…" : "Flash firmware"}
          </Button>
        </CardFooter>
      </Card>

      {isFlashing || progress ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                {progress?.message ?? "Waiting for flash service…"}
              </CardDescription>
            </div>
            {progress ? (
              <Badge
                variant={
                  progress.stage === "failed"
                    ? "destructive"
                    : progress.stage === "completed"
                      ? "success"
                      : "secondary"
                }
              >
                {stageLabel(progress.stage)}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress?.percent ?? (isFlashing ? 5 : 0)} />
            <p className="text-muted-foreground text-xs">
              {progress?.percent !== undefined
                ? `${String(Math.round(progress.percent))}%`
                : isFlashing
                  ? "Starting…"
                  : "Idle"}
              {progress?.bytesWritten !== undefined &&
              progress.bytesTotal !== undefined
                ? ` · ${formatFirmwareSize(progress.bytesWritten)} / ${formatFirmwareSize(progress.bytesTotal)}`
                : null}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
