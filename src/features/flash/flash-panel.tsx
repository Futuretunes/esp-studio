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
import type {
  FlashUiErrorKind,
  SelectedFirmware,
} from "@/features/flash/use-flash-workflow";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import type { DeviceSnapshot } from "@/store";

type FlashPanelProps = {
  activeDevice: DeviceSnapshot | null;
  webSerialSupported: boolean | null;
  firmware: SelectedFirmware | null;
  isFlashing: boolean;
  progress: FlashProgress | null;
  result: FlashResult | null;
  errorKind: FlashUiErrorKind;
  errorMessage: string | null;
  flashAddress: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
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
 * Flash UI surface: device summary, `.bin` picker, progress, and result.
 */
export function FlashPanel({
  activeDevice,
  webSerialSupported,
  firmware,
  isFlashing,
  progress,
  result,
  errorKind,
  errorMessage,
  flashAddress,
  fileInputRef,
  onSelectFile,
  onClearFile,
  onFlash,
}: FlashPanelProps): JSX.Element {
  const unsupported = webSerialSupported === false;
  const flashDisabled =
    unsupported ||
    isFlashing ||
    !activeDevice ||
    !firmware ||
    firmware.data.length === 0;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onSelectFile(file);
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
            {errorKind === "invalid-file" ? "Invalid file" : "No file selected"}
          </AlertTitle>
          <AlertDescription>
            {errorMessage ?? "Select a local .bin firmware file to continue."}
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
          <CardTitle>Firmware file</CardTitle>
          <CardDescription>
            Select one local <span className="font-medium">.bin</span> image.
            It will be written at{" "}
            <span className="font-mono text-xs">
              {formatFlashAddress(flashAddress)}
            </span>{" "}
            (application offset). Partition editing is not included in this MVP.
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

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isFlashing || unsupported}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              Choose .bin file
            </Button>
            {firmware ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isFlashing}
                onClick={onClearFile}
              >
                Clear
              </Button>
            ) : null}
          </div>

          {firmware ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">File</dt>
                <dd className="truncate text-sm font-medium">{firmware.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Firmware size</dt>
                <dd className="text-sm font-medium">
                  {formatFirmwareSize(firmware.size)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Flash address</dt>
                <dd className="font-mono text-sm">
                  {formatFlashAddress(flashAddress)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">
              No firmware selected yet.
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            disabled={flashDisabled}
            onClick={onFlash}
          >
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
