import type { ChangeEvent, JSX, RefObject } from "react";
import {
  CircuitBoard,
  Home,
  Lightbulb,
  Radio,
  type LucideIcon,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { isFirmwareChipCompatible } from "@/features/flash/chip-compatibility";
import { formatFlashAddress } from "@/features/flash/format-flash-address";
import { formatFirmwareSize } from "@/features/flash/format-firmware-size";
import type { FlashProgress } from "@/features/flash/FlashProgress";
import type { FlashResult } from "@/features/flash/FlashResult";
import type { FlashInspectionReport } from "@/features/flash/flash-inspection";
import {
  catalogSelectionKey,
  type FlashFirmwareSource,
  type FlashUiErrorKind,
} from "@/features/flash/use-flash-workflow";
import type { BuiltInCatalogEntry } from "@/features/firmware/catalog";
import type { FirmwareCatalogEntry } from "@/features/firmware/FirmwareProvider";
import type { FirmwareImage } from "@/features/firmware/FirmwareImage";
import type { FirmwareResolvedPackage } from "@/features/firmware/FirmwareProvider";
import type { GitHubReleaseSummary } from "@/features/firmware/providers/github";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import { cn } from "@/lib/utils";
import { useDeviceStore, type DeviceSnapshot } from "@/store";

type FlashPanelProps = {
  activeDevice: DeviceSnapshot | null;
  webSerialSupported: boolean | null;
  firmwareSource: FlashFirmwareSource;
  builtInEntries: readonly BuiltInCatalogEntry[];
  builtInCatalogStatus: "loading" | "ready" | "error";
  builtInCatalogError: string | null;
  selectedBuiltInId: string | null;
  repositorySlug: string;
  releaseSummary: GitHubReleaseSummary | null;
  isLoadingGithub: boolean;
  isResolving: boolean;
  catalogEntries: readonly FirmwareCatalogEntry[];
  selectionKey: string;
  resolved: FirmwareResolvedPackage | null;
  primaryImage: FirmwareImage | null;
  isFlashing: boolean;
  progress: FlashProgress | null;
  result: FlashResult | null;
  inspectionNotice: string | null;
  pendingOverwrite: FlashInspectionReport | null;
  errorKind: FlashUiErrorKind;
  errorMessage: string | null;
  githubReleasesHref: string | null;
  chipCompatibilityWarning: string | null;
  firmwareProjectLabel: string | null;
  firmwareVersionLabel: string | null;
  flashAddress: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFirmwareSourceChange: (source: FlashFirmwareSource) => void;
  onRepositorySlugChange: (slug: string) => void;
  onLoadGitHubRepository: () => void;
  onSelectBuiltInEntry: (entryId: string) => void;
  onRetryBuiltInCatalog: () => void;
  onSelectCatalogEntry: (key: string) => void;
  onSelectFile: (file: File | null) => void;
  onClearFile: () => void;
  onInstall: () => void;
  onConfirmOverwrite: () => void;
  onCancelOverwrite: () => void;
};

const BUILTIN_ICONS: Readonly<Record<string, LucideIcon>> = {
  wled: Lightbulb,
  esphome: Home,
  tasmota: CircuitBoard,
  openmqttgateway: Radio,
};

function stageLabel(stage: FlashProgress["stage"]): string {
  switch (stage) {
    case "preparing":
      return "Preparing";
    case "connecting":
      return "Connecting";
    case "inspecting":
      return "Inspecting";
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

function overwriteDialogTitle(
  outcome: FlashInspectionReport["outcome"],
): string {
  switch (outcome) {
    case "existing":
      return "Existing firmware detected";
    case "unknown":
      return "Firmware could not be identified";
    case "failed":
      return "Flash inspection failed";
    case "blank":
      return "Device appears empty";
  }
}

function formatPublishedDate(value: string | null): string {
  if (value === null || value.length === 0) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCategoryLabel(category: BuiltInCatalogEntry["category"]): string {
  switch (category) {
    case "lighting":
      return "Lighting";
    case "home-automation":
      return "Home automation";
    case "mqtt":
      return "MQTT";
    case "firmware":
      return "Firmware";
  }
}

/**
 * One-click Install Flash UI: project cards, auto-resolved options, Install.
 */
export function FlashPanel({
  activeDevice,
  webSerialSupported,
  firmwareSource,
  builtInEntries,
  builtInCatalogStatus,
  builtInCatalogError,
  selectedBuiltInId,
  repositorySlug,
  releaseSummary,
  isLoadingGithub,
  isResolving,
  catalogEntries,
  selectionKey,
  resolved,
  primaryImage,
  isFlashing,
  progress,
  result,
  inspectionNotice,
  pendingOverwrite,
  errorKind,
  errorMessage,
  githubReleasesHref,
  chipCompatibilityWarning,
  firmwareProjectLabel,
  firmwareVersionLabel,
  flashAddress,
  fileInputRef,
  onFirmwareSourceChange,
  onRepositorySlugChange,
  onLoadGitHubRepository,
  onSelectBuiltInEntry,
  onRetryBuiltInCatalog,
  onSelectCatalogEntry,
  onSelectFile,
  onClearFile,
  onInstall,
  onConfirmOverwrite,
  onCancelOverwrite,
}: FlashPanelProps): JSX.Element {
  const unsupported = webSerialSupported === false;
  const busy =
    isFlashing || isLoadingGithub || isResolving || pendingOverwrite !== null;
  const operationOwner = useDeviceStore((state) => state.operationOwner);
  const showInlineBusyAlert = errorKind === "busy" && operationOwner === null;
  const installDisabled =
    unsupported ||
    busy ||
    !activeDevice ||
    !primaryImage ||
    primaryImage.data.length === 0;
  const showGitHubOptions =
    firmwareSource === "github" || firmwareSource === "builtin";
  const showVersionSelector =
    showGitHubOptions &&
    releaseSummary !== null &&
    catalogEntries.length > 1;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onSelectFile(file);
  };

  const handleCatalogChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectCatalogEntry(event.target.value);
  };

  const handleSourceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "builtin" || value === "github" || value === "local") {
      onFirmwareSourceChange(value);
    }
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
            page, then return here to install firmware.
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "no-file" || errorKind === "invalid-file" ? (
        <Alert variant="warning">
          <AlertTitle>
            {errorKind === "invalid-file"
              ? "Invalid file"
              : "No installable firmware"}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="whitespace-pre-line">
              {errorMessage ?? "Select a firmware project to continue."}
            </p>
            <div className="flex flex-wrap gap-2">
              {githubReleasesHref ? (
                <Button type="button" size="sm" variant="secondary" asChild>
                  <a
                    href={githubReleasesHref}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open GitHub Releases
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  onFirmwareSourceChange("local");
                }}
              >
                Flash Local File
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "proxy-unavailable" ? (
        <Alert variant="warning">
          <AlertTitle>GitHub downloads unavailable</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="whitespace-pre-line">
              {errorMessage ??
                "This deployment cannot download firmware directly from GitHub.\n\nDownload the firmware from the project's GitHub Releases page and use 'Flash Local File' instead."}
            </p>
            <div className="flex flex-wrap gap-2">
              {githubReleasesHref ? (
                <Button type="button" size="sm" variant="secondary" asChild>
                  <a
                    href={githubReleasesHref}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open GitHub Releases
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onFirmwareSourceChange("local");
                }}
              >
                Flash Local File
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "provider" ? (
        <Alert variant="destructive">
          <AlertTitle>Firmware source error</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="whitespace-pre-line">
              {errorMessage ??
                "The selected firmware source could not be loaded."}
            </p>
            <div className="flex flex-wrap gap-2">
              {githubReleasesHref ? (
                <Button type="button" size="sm" variant="secondary" asChild>
                  <a
                    href={githubReleasesHref}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open GitHub Releases
                  </a>
                </Button>
              ) : null}
              {firmwareSource === "github" || firmwareSource === "builtin" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={onLoadGitHubRepository}
                >
                  Retry load
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  onFirmwareSourceChange("local");
                }}
              >
                Flash Local File
              </Button>
              {resolved ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={installDisabled}
                  onClick={onInstall}
                >
                  Retry install
                </Button>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {showInlineBusyAlert ? (
        <Alert variant="destructive">
          <AlertTitle>Device busy</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {errorMessage ??
                "Device is busy. Stop the other tool and try again."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" asChild>
                <Link to="/serial">Open Serial Monitor</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={installDisabled}
                onClick={onInstall}
              >
                Retry install
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {errorKind === "failed" || errorKind === "no-device" ? (
        <Alert variant="destructive">
          <AlertTitle>
            {errorMessage?.toLowerCase().includes("verif")
              ? "Verification failed"
              : "Install failed"}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {errorMessage ??
                "The firmware could not be installed. Check the cable and try again."}
            </p>
            <div className="flex flex-wrap gap-2">
              {errorKind === "no-device" ? (
                <Button type="button" size="sm" variant="secondary" asChild>
                  <Link to="/devices">Open Devices</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={installDisabled}
                  onClick={onInstall}
                >
                  Retry
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {chipCompatibilityWarning ? (
        <Alert variant="warning">
          <AlertTitle>Chip compatibility</AlertTitle>
          <AlertDescription>{chipCompatibilityWarning}</AlertDescription>
        </Alert>
      ) : null}

      {inspectionNotice && !pendingOverwrite ? (
        <Alert variant="info">
          <AlertTitle>Flash inspection</AlertTitle>
          <AlertDescription>{inspectionNotice}</AlertDescription>
        </Alert>
      ) : null}

      {pendingOverwrite ? (
        <Alert variant="warning">
          <AlertTitle>
            {overwriteDialogTitle(pendingOverwrite.outcome)}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="whitespace-pre-line">{pendingOverwrite.message}</p>
            <dl className="grid gap-2 sm:grid-cols-2">
              {pendingOverwrite.rawChipName || pendingOverwrite.chipFamily ? (
                <div>
                  <dt className="text-muted-foreground text-xs">Chip</dt>
                  <dd className="text-sm font-medium">
                    {pendingOverwrite.rawChipName ??
                      (pendingOverwrite.chipFamily
                        ? formatChipLabel(pendingOverwrite.chipFamily)
                        : null)}
                  </dd>
                </div>
              ) : null}
              {pendingOverwrite.flashSize ? (
                <div>
                  <dt className="text-muted-foreground text-xs">Flash size</dt>
                  <dd className="text-sm font-medium">
                    {pendingOverwrite.flashSize}
                  </dd>
                </div>
              ) : null}
              {firmwareProjectLabel ? (
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Installing project
                  </dt>
                  <dd className="text-sm font-medium">{firmwareProjectLabel}</dd>
                </div>
              ) : null}
              {firmwareVersionLabel ? (
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Installing version
                  </dt>
                  <dd className="text-sm font-medium">{firmwareVersionLabel}</dd>
                </div>
              ) : null}
            </dl>
            <p>
              Installing new firmware will overwrite the existing installation.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                autoFocus
                disabled={busy}
                onClick={onCancelOverwrite}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busy || !primaryImage}
                onClick={onConfirmOverwrite}
              >
                Overwrite Firmware
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {result?.success === true ? (
        <Alert variant="info">
          <AlertTitle>Install completed</AlertTitle>
          <AlertDescription>
            {result.message ??
              "Firmware was written, verified, and the device was reset."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Install summary</CardTitle>
            <CardDescription>
              Device and firmware ready for one-click install.
            </CardDescription>
          </div>
          {activeDevice ? (
            <Badge
              variant={
                activeDevice.status === "connected" ? "success" : "secondary"
              }
            >
              {activeDevice.status}
            </Badge>
          ) : (
            <Badge variant="secondary">No device</Badge>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-xs">Device</dt>
              <dd className="text-sm font-medium">
                {activeDevice?.name ?? "Not connected"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Chip</dt>
              <dd className="text-sm font-medium">
                {activeDevice
                  ? formatChipLabel(activeDevice.chipFamily)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Firmware project</dt>
              <dd className="truncate text-sm font-medium">
                {firmwareProjectLabel ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Firmware version</dt>
              <dd className="text-sm font-medium">
                {firmwareVersionLabel ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Firmware size</dt>
              <dd className="text-sm font-medium">
                {primaryImage
                  ? formatFirmwareSize(primaryImage.size)
                  : isResolving || isLoadingGithub
                    ? "Loading…"
                    : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Flash address</dt>
              <dd className="font-mono text-sm">
                {primaryImage
                  ? formatFlashAddress(primaryImage.address)
                  : formatFlashAddress(flashAddress)}
              </dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          {resolved ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onClearFile}
            >
              Clear
            </Button>
          ) : null}
          <Button type="button" disabled={installDisabled} onClick={onInstall}>
            {isFlashing
              ? "Installing…"
              : isResolving || isLoadingGithub
                ? "Preparing…"
                : "Install Firmware"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choose firmware</CardTitle>
          <CardDescription>
            Select a project. The latest release loads automatically; Install
            becomes ready when firmware is resolved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin,application/octet-stream"
            className="hidden"
            disabled={busy || unsupported}
            onChange={handleFileChange}
          />

          <div className="space-y-2">
            <label
              htmlFor="firmware-source-select"
              className="text-muted-foreground text-xs"
            >
              Firmware source
            </label>
            <select
              id="firmware-source-select"
              value={firmwareSource}
              disabled={busy || unsupported}
              onChange={handleSourceChange}
              className={cn(
                "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="builtin">Built-in Catalog</option>
              <option value="github">GitHub Repository</option>
              <option value="local">Local File</option>
            </select>
          </div>

          {firmwareSource === "builtin" ? (
            <div className="space-y-4">
              {builtInCatalogStatus === "loading" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              ) : null}

              {builtInCatalogStatus === "error" ? (
                <Alert variant="destructive">
                  <AlertTitle>Built-in catalog unavailable</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>
                      {builtInCatalogError ??
                        "The built-in firmware catalog could not be loaded."}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={onRetryBuiltInCatalog}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              {builtInCatalogStatus === "ready" &&
              builtInEntries.length === 0 ? (
                <Alert variant="info">
                  <AlertTitle>No built-in projects</AlertTitle>
                  <AlertDescription>
                    The built-in catalog is empty. Choose GitHub Repository or
                    Local File instead.
                  </AlertDescription>
                </Alert>
              ) : null}

              {builtInCatalogStatus === "ready" && builtInEntries.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {builtInEntries.map((entry) => {
                    const Icon = BUILTIN_ICONS[entry.icon] ?? CircuitBoard;
                    const selected = selectedBuiltInId === entry.id;
                    const chipHint =
                      activeDevice &&
                      activeDevice.chipFamily !== "unknown" &&
                      !isFirmwareChipCompatible(
                        entry.chipFamilies,
                        activeDevice.chipFamily,
                      );
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        disabled={busy || unsupported}
                        onClick={() => {
                          onSelectBuiltInEntry(entry.id);
                        }}
                        className={cn(
                          "border-border bg-card hover:bg-accent/40 focus-visible:ring-ring rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                          selected && "border-primary ring-primary/30 ring-1",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{entry.name}</p>
                              <p className="text-muted-foreground text-xs leading-relaxed">
                                {entry.description}
                              </p>
                              <p className="text-muted-foreground font-mono text-[11px]">
                                {entry.repository}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {entry.featured ? (
                              <Badge variant="secondary">Popular</Badge>
                            ) : null}
                            <Badge variant="outline">
                              {formatCategoryLabel(entry.category)}
                            </Badge>
                            {chipHint ? (
                              <Badge variant="destructive">Chip warning</Badge>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {isLoadingGithub || isResolving ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : null}
            </div>
          ) : null}

          {firmwareSource === "github" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="github-repository-input"
                  className="text-muted-foreground text-xs"
                >
                  Repository
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="github-repository-input"
                    value={repositorySlug}
                    placeholder="Aircoookie/WLED"
                    disabled={busy || unsupported}
                    onChange={(event) => {
                      onRepositorySlugChange(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onLoadGitHubRepository();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={
                      busy || unsupported || repositorySlug.trim().length === 0
                    }
                    onClick={onLoadGitHubRepository}
                  >
                    {isLoadingGithub ? "Loading…" : "Load release"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {showGitHubOptions && releaseSummary ? (
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground text-xs">Repository</dt>
                <dd className="text-sm font-medium">
                  {releaseSummary.owner}/{releaseSummary.repository}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Latest release</dt>
                <dd className="text-sm font-medium">
                  {releaseSummary.name ?? releaseSummary.tagName}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Published</dt>
                <dd className="text-sm font-medium">
                  {formatPublishedDate(releaseSummary.publishedAt)}
                </dd>
              </div>
            </dl>
          ) : null}

          {showVersionSelector ? (
            <div className="space-y-2">
              <label
                htmlFor="firmware-version-select"
                className="text-muted-foreground text-xs"
              >
                Firmware version / image
              </label>
              <select
                id="firmware-version-select"
                value={selectionKey}
                disabled={busy || unsupported}
                onChange={handleCatalogChange}
                className={cn(
                  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {catalogEntries.map((entry) => {
                  const key = catalogSelectionKey(
                    entry.manifest.providerId,
                    entry.manifest.id,
                  );
                  const families =
                    entry.manifest.chipFamilies ??
                    builtInEntries.find((item) => item.id === selectedBuiltInId)
                      ?.chipFamilies;
                  const compatible = isFirmwareChipCompatible(
                    families,
                    activeDevice?.chipFamily,
                  );
                  return (
                    <option key={key} value={key}>
                      {entry.manifest.title}
                      {entry.manifest.version
                        ? ` · ${entry.manifest.version}`
                        : ""}
                      {!compatible ? " (may be incompatible)" : ""}
                    </option>
                  );
                })}
              </select>
              <p className="text-muted-foreground text-xs">
                Compatible options are listed first. Incompatible builds stay
                visible with a warning.
              </p>
            </div>
          ) : null}

          {firmwareSource === "local" ? (
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
                disabled={busy || unsupported}
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
          ) : null}

          {firmwareSource === "builtin" &&
          selectedBuiltInId === null &&
          !isLoadingGithub ? (
            <p className="text-muted-foreground text-sm">
              Choose a project card to load its latest release and prepare
              Install.
            </p>
          ) : null}
        </CardContent>
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
