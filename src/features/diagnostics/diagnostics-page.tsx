import { useCallback, useEffect, useState, type JSX } from "react";
import { Copy, Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { useDeviceManager } from "@/app/device-context";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DiagnosticsCard,
  DiagnosticsField,
  DiagnosticsStatusBadge,
  diagnosticsDisplayValue,
} from "@/features/diagnostics/diagnostics-card";
import {
  copyDiagnosticsReport,
  downloadDiagnosticsReport,
} from "@/features/diagnostics/diagnostics-export";
import {
  collectDiagnosticsReport,
  type DiagnosticsCollectInput,
  type DiagnosticsReport,
} from "@/features/diagnostics/diagnostics-report";
import { findBuiltInCatalogEntry } from "@/features/firmware/catalog";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import { readRecentFirmwareIds } from "@/features/library/recent";
import {
  formatBuiltAtLabel,
  formatCommitLabel,
  loadBuildInfo,
} from "@/lib/build-info";
import { isWebSerialSupported } from "@/providers/web-serial";
import { useDeviceStore } from "@/store";

/**
 * Reads a browser platform label without using deprecated `navigator.platform`.
 */
function readBrowserPlatform(): string {
  const uaData = (
    navigator as Navigator & {
      userAgentData?: { platform?: string };
    }
  ).userAgentData;
  if (uaData?.platform !== undefined && uaData.platform.length > 0) {
    return uaData.platform;
  }
  return "unknown";
}

/**
 * Device Diagnostics page — inspect + export support report.
 */
export function DiagnosticsPage(): JSX.Element {
  const manager = useDeviceManager();
  const activeDevice = useDeviceStore((state) => state.activeDevice);
  const isConnecting = useDeviceStore((state) => state.isConnecting);
  const isDisconnecting = useDeviceStore((state) => state.isDisconnecting);
  const errorKind = useDeviceStore((state) => state.errorKind);
  const errorMessage = useDeviceStore((state) => state.errorMessage);
  const setWebSerialSupported = useDeviceStore(
    (state) => state.setWebSerialSupported,
  );

  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const buildCollectInput = useCallback(async (): Promise<DiagnosticsCollectInput> => {
    const supported = isWebSerialSupported();
    setWebSerialSupported(supported);

    const application = await loadBuildInfo();
    const recentIds = readRecentFirmwareIds();
    const recentId = recentIds[0] ?? null;
    const recentEntry =
      recentId !== null ? await findBuiltInCatalogEntry(recentId) : undefined;

    const live = activeDevice
      ? manager.getDevice(activeDevice.id)
      : undefined;
    const metadata = live?.info.metadata ?? null;

    return {
      application,
      webSerialSupported: supported,
      isConnecting,
      isDisconnecting,
      errorKind,
      errorMessage,
      activeDevice,
      deviceMetadata: metadata,
      recentProjectId: recentEntry?.id ?? recentId,
      recentProjectName: recentEntry?.name ?? null,
      recentRepository: recentEntry?.repository ?? null,
      browser: {
        userAgent: navigator.userAgent,
        platform: readBrowserPlatform(),
        language: navigator.language,
        webSerialAvailable: supported,
      },
    };
  }, [
    activeDevice,
    errorKind,
    errorMessage,
    isConnecting,
    isDisconnecting,
    manager,
    setWebSerialSupported,
  ]);

  useEffect(() => {
    let cancelled = false;
    void buildCollectInput()
      .then((input) => {
        if (cancelled) {
          return;
        }
        setReport(collectDiagnosticsReport(input));
      })
      .catch(() => {
        if (!cancelled) {
          setReport(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [buildCollectInput]);

  const handleRefresh = (): void => {
    setIsRefreshing(true);
    setCopyStatus(null);
    void buildCollectInput()
      .then((input) => {
        setReport(collectDiagnosticsReport(input));
      })
      .catch(() => {
        setReport(null);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  const handleExport = (): void => {
    if (!report) {
      return;
    }
    downloadDiagnosticsReport(report);
  };

  const handleCopy = async (): Promise<void> => {
    if (!report) {
      return;
    }
    const ok = await copyDiagnosticsReport(report);
    setCopyStatus(
      ok
        ? "Copied diagnostics JSON to the clipboard."
        : "Clipboard unavailable.",
    );
  };

  return (
    <div>
      <PageHeader
        title="Diagnostics"
        description="Inspect connection and environment facts, then export a support report."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isRefreshing}
              onClick={handleRefresh}
            >
              <RefreshCw
                className={
                  isRefreshing ? "size-3.5 animate-spin" : "size-3.5"
                }
              />
              Refresh
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!report}
              onClick={() => {
                void handleCopy();
              }}
            >
              <Copy className="size-3.5" />
              Copy JSON
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!report}
              onClick={handleExport}
            >
              <Download className="size-3.5" />
              Export
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {!activeDevice ? (
          <Alert variant="info">
            <AlertTitle>No device connected</AlertTitle>
            <AlertDescription>
              Connect a board on{" "}
              <Link to="/devices" className="underline underline-offset-4">
                Devices
              </Link>{" "}
              to include live chip and capability details. App and browser facts
              still export without a device.
            </AlertDescription>
          </Alert>
        ) : null}

        {copyStatus ? (
          <Alert variant="info">
            <AlertTitle>Clipboard</AlertTitle>
            <AlertDescription>{copyStatus}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <DiagnosticsCard
            title="Device"
            description="Live Device Layer snapshot and identify metadata."
          >
            <dl className="grid gap-3 sm:grid-cols-2">
              <DiagnosticsField
                label="Device"
                value={diagnosticsDisplayValue(report?.device?.name)}
              />
              <DiagnosticsField
                label="Connection state"
                value={
                  report?.device ? (
                    <DiagnosticsStatusBadge status={report.device.status} />
                  ) : (
                    "Not connected"
                  )
                }
              />
              <DiagnosticsField
                label="Chip"
                value={
                  report?.device
                    ? formatChipLabel(report.device.chipFamily)
                    : "Not available"
                }
              />
              <DiagnosticsField
                label="Chip revision"
                value={diagnosticsDisplayValue(report?.device?.chipRevision)}
              />
              <DiagnosticsField
                label="Flash size"
                value={diagnosticsDisplayValue(report?.device?.flashSize)}
              />
              <DiagnosticsField
                label="Flash manufacturer"
                value={diagnosticsDisplayValue(
                  report?.device?.flashManufacturer,
                )}
              />
              <DiagnosticsField
                label="Filesystem type"
                value={
                  report?.device?.filesystemType === "unsupported"
                    ? "Unsupported by this connection"
                    : diagnosticsDisplayValue(report?.device?.filesystemType)
                }
              />
              <DiagnosticsField
                label="Raw chip name"
                value={diagnosticsDisplayValue(report?.device?.chipRawName)}
                mono
              />
              <DiagnosticsField
                label="Provider"
                value={diagnosticsDisplayValue(report?.device?.providerLabel)}
              />
              <DiagnosticsField
                label="Transport"
                value={diagnosticsDisplayValue(report?.device?.transportLabel)}
                mono
              />
            </dl>
          </DiagnosticsCard>

          <DiagnosticsCard
            title="Environment"
            description="Browser and Web Serial availability."
          >
            <dl className="grid gap-3 sm:grid-cols-2">
              <DiagnosticsField
                label="Web Serial"
                value={
                  report ? (
                    <DiagnosticsStatusBadge
                      status={
                        report.browser.webSerialAvailable
                          ? "available"
                          : "unavailable"
                      }
                    />
                  ) : (
                    "…"
                  )
                }
              />
              <DiagnosticsField
                label="Platform"
                value={diagnosticsDisplayValue(report?.browser.platform)}
                mono
              />
              <DiagnosticsField
                label="Language"
                value={diagnosticsDisplayValue(report?.browser.language)}
              />
              <DiagnosticsField
                label="User agent"
                value={diagnosticsDisplayValue(report?.browser.userAgent)}
                mono
              />
            </dl>
          </DiagnosticsCard>

          <DiagnosticsCard
            title="Firmware context"
            description="Recent Firmware Library selection (not verified on-device)."
          >
            <dl className="grid gap-3 sm:grid-cols-2">
              <DiagnosticsField
                label="Firmware project"
                value={diagnosticsDisplayValue(
                  report?.firmware.recentProjectName,
                )}
              />
              <DiagnosticsField
                label="Firmware version"
                value={diagnosticsDisplayValue(report?.firmware.version)}
              />
              <DiagnosticsField
                label="Repository"
                value={diagnosticsDisplayValue(
                  report?.firmware.recentRepository,
                )}
                mono
              />
              <DiagnosticsField
                label="Note"
                value={diagnosticsDisplayValue(report?.firmware.note)}
              />
            </dl>
          </DiagnosticsCard>

          <DiagnosticsCard
            title="Application"
            description="Build metadata from /build.json."
          >
            <dl className="grid gap-3 sm:grid-cols-2">
              <DiagnosticsField
                label="Application version"
                value={diagnosticsDisplayValue(report?.application.version)}
                mono
              />
              <DiagnosticsField
                label="Git commit"
                value={
                  report
                    ? formatCommitLabel(report.application.commit)
                    : "Not available"
                }
                mono
              />
              <DiagnosticsField
                label="Build date"
                value={
                  report
                    ? formatBuiltAtLabel(report.application.builtAt)
                    : "Not available"
                }
              />
              <DiagnosticsField
                label="Report generated"
                value={diagnosticsDisplayValue(report?.generatedAt)}
                mono
              />
            </dl>
          </DiagnosticsCard>
        </div>

        {report && report.recentErrors.length > 0 ? (
          <DiagnosticsCard
            title="Recent errors"
            description="Current device UI error only (no historical ring buffer)."
          >
            <ul className="space-y-2">
              {report.recentErrors.map((entry) => (
                <li
                  key={`${entry.source}-${entry.kind ?? "none"}-${entry.message}`}
                >
                  <Alert variant="destructive">
                    <AlertTitle>
                      {entry.source}
                      {entry.kind ? ` · ${entry.kind}` : ""}
                    </AlertTitle>
                    <AlertDescription>{entry.message}</AlertDescription>
                  </Alert>
                </li>
              ))}
            </ul>
          </DiagnosticsCard>
        ) : null}

        {report?.device ? (
          <DiagnosticsCard title="Capabilities">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Serial", report.device.capabilities.serial],
                  ["Flash", report.device.capabilities.flash],
                  ["Filesystem", report.device.capabilities.filesystem],
                  ["OTA", report.device.capabilities.ota],
                  ["Baud control", report.device.capabilities.baudRateControl],
                ] as const
              ).map(([label, enabled]) => (
                <DiagnosticsStatusBadge
                  key={label}
                  status={enabled ? `${label}: yes` : `${label}: no`}
                />
              ))}
            </div>
          </DiagnosticsCard>
        ) : null}
      </div>
    </div>
  );
}
