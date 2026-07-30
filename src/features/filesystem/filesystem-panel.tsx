import type { ChangeEvent, JSX } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  File,
  Folder,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";

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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilesystemEntry } from "@/features/filesystem/FileEntry";
import { formatFirmwareSize } from "@/features/flash/format-firmware-size";
import { useFilesystemBrowser } from "@/features/filesystem/use-filesystem-browser";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import { cn } from "@/lib/utils";

/**
 * Filesystem browser + transfer panel.
 */
export function FilesystemPanel(): JSX.Element {
  const {
    activeDevice,
    webSerialSupported,
    operationOwner,
    rootEntries,
    childrenByPath,
    expandedPaths,
    loadingPaths,
    selectedPath,
    selectedKind,
    isRefreshing,
    isTransferring,
    transferProgress,
    errorCode,
    errorMessage,
    pendingUpload,
    fileInputRef,
    refreshRoot,
    toggleDirectory,
    selectEntry,
    requestUpload,
    handleUploadFileChosen,
    confirmOverwrite,
    cancelOverwrite,
    downloadSelected,
  } = useFilesystemBrowser();

  const unsupported = webSerialSupported === false;
  const rootLoading = loadingPaths.has("/");
  const readingFilesystem = isRefreshing || rootLoading;
  const busy = readingFilesystem || isTransferring;
  const uploadDisabled =
    unsupported || busy || !activeDevice || selectedKind !== "directory";
  const downloadDisabled =
    unsupported || busy || !activeDevice || selectedKind !== "file";
  /** Cross-page DeviceBusyBanner already covers other owners — avoid stacking. */
  const showInlineBusyAlert =
    errorMessage !== null &&
    errorCode === "busy" &&
    operationOwner === null;

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    void handleUploadFileChosen(file);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInput}
      />

      {unsupported || errorCode === "unsupported" ? (
        <Alert variant="warning">
          <AlertTitle>
            {errorCode === "unsupported" && errorMessage
              ? "Unsupported"
              : "Browser unsupported"}
          </AlertTitle>
          <AlertDescription>
            {errorMessage ??
              "Web Serial is required to browse the device filesystem. Use a Chromium-based browser on HTTPS or localhost."}
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
            page, then refresh to list filesystem volumes.
          </AlertDescription>
        </Alert>
      ) : null}

      {showInlineBusyAlert ? (
        <Alert variant="destructive">
          <AlertTitle>Device busy</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{errorMessage}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" asChild>
                <Link to="/serial">Open Serial Monitor</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!activeDevice || busy}
                onClick={() => {
                  void refreshRoot();
                }}
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage && errorCode === "exists" && pendingUpload ? (
        <Alert variant="warning">
          <AlertTitle>Overwrite file?</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              <span className="font-medium">{pendingUpload.name}</span> already
              exists on the device. Replace it with the selected upload?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => {
                  void confirmOverwrite();
                }}
              >
                Overwrite
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={cancelOverwrite}
              >
                Cancel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {errorMessage &&
      errorCode !== "busy" &&
      errorCode !== "unsupported" &&
      errorCode !== "exists" ? (
        <Alert variant="destructive">
          <AlertTitle>
            {errorCode === "no-device"
              ? "No device"
              : errorCode === "not-found"
                ? "Not found"
                : errorCode === "invalid-path"
                  ? "Invalid path"
                  : "Filesystem"}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{errorMessage}</p>
            <div className="flex flex-wrap gap-2">
              {errorCode === "no-device" ? (
                <Button type="button" size="sm" variant="secondary" asChild>
                  <Link to="/devices">Open Devices</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!activeDevice || busy}
                  onClick={() => {
                    void refreshRoot();
                  }}
                >
                  Retry
                </Button>
              )}
            </div>
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
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  activeDevice.status === "connected" ? "success" : "secondary"
                }
              >
                {activeDevice.status}
              </Badge>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploadDisabled}
                onClick={requestUpload}
              >
                <Upload className="size-3.5" />
                Upload
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={downloadDisabled}
                onClick={() => {
                  void downloadSelected();
                }}
              >
                <Download className="size-3.5" />
                Download
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={unsupported || busy}
                aria-busy={readingFilesystem}
                onClick={() => {
                  void refreshRoot();
                }}
              >
                <RefreshCw
                  className={cn(
                    "size-3.5",
                    readingFilesystem && "animate-spin",
                  )}
                />
                Refresh
              </Button>
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
                <dt className="text-muted-foreground text-xs">Selection</dt>
                <dd className="truncate font-mono text-xs">
                  {selectedPath ??
                    "None — select a folder to upload or a file to download"}
                </dd>
              </div>
            </dl>

            {readingFilesystem ? (
              <div
                className="text-muted-foreground flex items-center gap-2 text-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>Reading filesystem…</span>
              </div>
            ) : null}

            {isTransferring || transferProgress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{transferProgress?.message ?? "Transferring…"}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {transferProgress?.percent !== undefined
                      ? `${String(transferProgress.percent)}%`
                      : ""}
                  </span>
                </div>
                <Progress value={transferProgress?.percent ?? 0} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Root directory</CardTitle>
          <CardDescription>
            Select a volume or folder to upload into, or a file to download.
            SPIFFS transfers are supported in this MVP; LittleFS transfer may be
            unsupported depending on the image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeDevice ? (
            <p className="text-muted-foreground text-sm">
              Connect a device to browse its filesystem.
            </p>
          ) : readingFilesystem && rootEntries.length === 0 ? (
            <div className="space-y-3">
              <div
                className="text-muted-foreground flex items-center gap-2 text-sm"
                role="status"
              >
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>Reading filesystem…</span>
              </div>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
              <Skeleton className="h-8 w-4/6" />
            </div>
          ) : rootEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No filesystem volumes are listed yet. Click Refresh after ensuring
              the Serial Monitor is stopped.
            </p>
          ) : (
            <ul className="space-y-1">
              {rootEntries.map((entry) => (
                <FilesystemTreeNode
                  key={entry.path}
                  entry={entry}
                  depth={0}
                  selectedPath={selectedPath}
                  expandedPaths={expandedPaths}
                  childrenByPath={childrenByPath}
                  loadingPaths={loadingPaths}
                  disabled={busy}
                  onSelect={selectEntry}
                  onToggle={(path) => {
                    void toggleDirectory(path);
                  }}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type FilesystemTreeNodeProps = {
  entry: FilesystemEntry;
  depth: number;
  selectedPath: string | null;
  expandedPaths: ReadonlySet<string>;
  childrenByPath: Readonly<Record<string, readonly FilesystemEntry[]>>;
  loadingPaths: ReadonlySet<string>;
  disabled: boolean;
  onSelect: (entry: FilesystemEntry) => void;
  onToggle: (path: string) => void;
};

function FilesystemTreeNode({
  entry,
  depth,
  selectedPath,
  expandedPaths,
  childrenByPath,
  loadingPaths,
  disabled,
  onSelect,
  onToggle,
}: FilesystemTreeNodeProps): JSX.Element {
  const isDirectory = entry.kind === "directory";
  const expanded = expandedPaths.has(entry.path);
  const loading = loadingPaths.has(entry.path);
  const children = childrenByPath[entry.path] ?? [];
  const selected = selectedPath === entry.path;

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
          selected ? "bg-accent" : "hover:bg-accent/40",
          disabled && "pointer-events-none opacity-60",
        )}
        style={{ paddingLeft: `${String(8 + depth * 16)}px` }}
      >
        {isDirectory ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex size-5 items-center justify-center"
            aria-label={
              expanded ? `Collapse ${entry.name}` : `Expand ${entry.name}`
            }
            disabled={disabled}
            onClick={() => {
              onToggle(entry.path);
            }}
          >
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        ) : (
          <span className="inline-flex size-5" />
        )}

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          disabled={disabled}
          onClick={() => {
            onSelect(entry);
          }}
        >
          {isDirectory ? (
            <Folder className="text-muted-foreground size-3.5 shrink-0" />
          ) : (
            <File className="text-muted-foreground size-3.5 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate font-medium">
            {entry.name}
          </span>
          {entry.kind === "file" ? (
            <span className="text-muted-foreground shrink-0 font-mono text-xs">
              {formatFirmwareSize(entry.size)}
            </span>
          ) : entry.size !== undefined ? (
            <span className="text-muted-foreground shrink-0 font-mono text-xs">
              {formatFirmwareSize(entry.size)}
            </span>
          ) : null}
        </button>
      </div>

      {isDirectory && expanded ? (
        <ul className="space-y-1">
          {loading && children.length === 0 ? (
            <li
              className="px-2 py-1"
              style={{ paddingLeft: `${String(28 + depth * 16)}px` }}
            >
              <Skeleton className="h-6 w-2/3" />
            </li>
          ) : children.length === 0 ? (
            <li
              className="text-muted-foreground px-2 py-1 text-xs"
              style={{ paddingLeft: `${String(28 + depth * 16)}px` }}
            >
              Empty directory
            </li>
          ) : (
            children.map((child) => (
              <FilesystemTreeNode
                key={child.path}
                entry={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                childrenByPath={childrenByPath}
                loadingPaths={loadingPaths}
                disabled={disabled}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))
          )}
        </ul>
      ) : null}
    </li>
  );
}
