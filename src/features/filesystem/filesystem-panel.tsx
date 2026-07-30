import type { JSX } from "react";
import { ChevronDown, ChevronRight, File, Folder, RefreshCw } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { FilesystemEntry } from "@/features/filesystem/FileEntry";
import { formatFirmwareSize } from "@/features/flash/format-firmware-size";
import { useFilesystemBrowser } from "@/features/filesystem/use-filesystem-browser";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import { cn } from "@/lib/utils";

/**
 * Filesystem browser panel: device summary, tree, refresh, loading/errors.
 */
export function FilesystemPanel(): JSX.Element {
  const {
    activeDevice,
    webSerialSupported,
    rootEntries,
    childrenByPath,
    expandedPaths,
    loadingPaths,
    isRefreshing,
    errorMessage,
    refreshRoot,
    toggleDirectory,
  } = useFilesystemBrowser();

  const unsupported = webSerialSupported === false;
  const rootLoading = loadingPaths.has("/");

  return (
    <div className="space-y-4">
      {unsupported ? (
        <Alert variant="warning">
          <AlertTitle>Browser unsupported</AlertTitle>
          <AlertDescription>
            Web Serial is required to browse the device filesystem. Use a
            Chromium-based browser on HTTPS or localhost.
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

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Filesystem</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
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
                disabled={unsupported || isRefreshing || rootLoading}
                onClick={() => {
                  void refreshRoot();
                }}
              >
                <RefreshCw
                  className={cn("size-3.5", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
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
          <CardTitle>Root directory</CardTitle>
          <CardDescription>
            Volumes discovered from the device partition table. Expand a folder
            to list files. Browse only — no upload, download, or delete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeDevice ? (
            <p className="text-muted-foreground text-sm">
              Connect a device to browse its filesystem.
            </p>
          ) : rootLoading && rootEntries.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
              <Skeleton className="h-8 w-4/6" />
            </div>
          ) : rootEntries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No filesystem volumes are listed yet. Tap Refresh after ensuring
              the Serial Monitor is stopped.
            </p>
          ) : (
            <ul className="space-y-1">
              {rootEntries.map((entry) => (
                <FilesystemTreeNode
                  key={entry.path}
                  entry={entry}
                  depth={0}
                  expandedPaths={expandedPaths}
                  childrenByPath={childrenByPath}
                  loadingPaths={loadingPaths}
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
  expandedPaths: ReadonlySet<string>;
  childrenByPath: Readonly<Record<string, readonly FilesystemEntry[]>>;
  loadingPaths: ReadonlySet<string>;
  onToggle: (path: string) => void;
};

function FilesystemTreeNode({
  entry,
  depth,
  expandedPaths,
  childrenByPath,
  loadingPaths,
  onToggle,
}: FilesystemTreeNodeProps): JSX.Element {
  const isDirectory = entry.kind === "directory";
  const expanded = expandedPaths.has(entry.path);
  const loading = loadingPaths.has(entry.path);
  const children = childrenByPath[entry.path] ?? [];

  return (
    <li>
      <div
        className={cn(
          "hover:bg-accent/40 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        )}
        style={{ paddingLeft: `${String(8 + depth * 16)}px` }}
      >
        {isDirectory ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground inline-flex size-5 items-center justify-center"
            aria-label={expanded ? `Collapse ${entry.name}` : `Expand ${entry.name}`}
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

        {isDirectory ? (
          <Folder className="text-muted-foreground size-3.5 shrink-0" />
        ) : (
          <File className="text-muted-foreground size-3.5 shrink-0" />
        )}

        <span className="min-w-0 flex-1 truncate font-medium">{entry.name}</span>

        {entry.kind === "file" ? (
          <span className="text-muted-foreground shrink-0 font-mono text-xs">
            {formatFirmwareSize(entry.size)}
          </span>
        ) : entry.size !== undefined ? (
          <span className="text-muted-foreground shrink-0 font-mono text-xs">
            {formatFirmwareSize(entry.size)}
          </span>
        ) : null}
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
                expandedPaths={expandedPaths}
                childrenByPath={childrenByPath}
                loadingPaths={loadingPaths}
                onToggle={onToggle}
              />
            ))
          )}
        </ul>
      ) : null}
    </li>
  );
}
