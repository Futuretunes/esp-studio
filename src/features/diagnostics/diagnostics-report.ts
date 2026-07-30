/**
 * Diagnostics report model (schemaVersion 1).
 *
 * Nullable hardware fields are reserved for future identify enrichment.
 */

import type { ChipFamily, DeviceCapabilities, DeviceConnectionState } from "@/core/device";
import type { BuildInfo } from "@/lib/build-info";

/**
 * Current schema version for exported diagnostics JSON.
 */
export const DIAGNOSTICS_REPORT_SCHEMA_VERSION = 1 as const;

/**
 * Browser / runtime facts safe to include in a support report.
 */
export type DiagnosticsBrowserInfo = {
  readonly userAgent: string;
  readonly platform: string;
  readonly language: string;
  readonly webSerialAvailable: boolean;
};

/**
 * Device section — only fields already knowable from Device Layer / store.
 */
export type DiagnosticsDeviceInfo = {
  readonly id: string;
  readonly name: string;
  readonly providerId: string;
  readonly providerLabel: string;
  readonly chipFamily: ChipFamily;
  /** Raw esptool chip name when identify stored it on device metadata. */
  readonly chipRawName: string | null;
  readonly status: DeviceConnectionState;
  readonly transportLabel: string | null;
  readonly capabilities: DeviceCapabilities;
  /** Not returned by current identify — always null in this MVP. */
  readonly chipRevision: string | null;
  /** Not returned by current identify — always null in this MVP. */
  readonly flashSize: string | null;
  /** Not returned by current identify — always null in this MVP. */
  readonly flashManufacturer: string | null;
  /**
   * Filesystem format hint.
   *
   * Browse capability is known; concrete SPIFFS/LittleFS detection requires a
   * filesystem list and is left null unless a caller supplies it.
   */
  readonly filesystemType: string | null;
};

/**
 * Firmware context from library recents — not a guarantee of on-device firmware.
 */
export type DiagnosticsFirmwareInfo = {
  readonly recentProjectId: string | null;
  readonly recentProjectName: string | null;
  readonly recentRepository: string | null;
  readonly version: string | null;
  readonly note: string;
};

/**
 * Connection / UI error snapshot from the device store.
 */
export type DiagnosticsConnectionInfo = {
  readonly webSerialSupported: boolean | null;
  readonly isConnecting: boolean;
  readonly isDisconnecting: boolean;
  readonly errorKind: string | null;
  readonly errorMessage: string | null;
};

/**
 * A single recent error entry (currently at most the active device UI error).
 */
export type DiagnosticsErrorEntry = {
  readonly source: string;
  readonly kind: string | null;
  readonly message: string;
};

/**
 * Full diagnostics export payload.
 */
export type DiagnosticsReport = {
  readonly schemaVersion: typeof DIAGNOSTICS_REPORT_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly application: BuildInfo;
  readonly browser: DiagnosticsBrowserInfo;
  readonly device: DiagnosticsDeviceInfo | null;
  readonly firmware: DiagnosticsFirmwareInfo;
  readonly connection: DiagnosticsConnectionInfo;
  readonly recentErrors: readonly DiagnosticsErrorEntry[];
};

/**
 * Inputs gathered from existing app surfaces (no new services).
 */
export type DiagnosticsCollectInput = {
  readonly application: BuildInfo;
  readonly webSerialSupported: boolean | null;
  readonly isConnecting: boolean;
  readonly isDisconnecting: boolean;
  readonly errorKind: string | null;
  readonly errorMessage: string | null;
  readonly activeDevice: {
    readonly id: string;
    readonly name: string;
    readonly providerId: string;
    readonly providerLabel: string;
    readonly chipFamily: ChipFamily;
    readonly status: DeviceConnectionState;
    readonly transportLabel?: string;
    readonly capabilities: DeviceCapabilities;
  } | null;
  /** Optional metadata from `DeviceManager.getDevice(id).info.metadata`. */
  readonly deviceMetadata: Readonly<Record<string, string>> | null;
  readonly recentProjectId: string | null;
  readonly recentProjectName: string | null;
  readonly recentRepository: string | null;
  readonly browser: DiagnosticsBrowserInfo;
  readonly generatedAt?: string;
};

/**
 * Builds a {@link DiagnosticsReport} from already-available inputs.
 *
 * @param input - Collected facts from stores / browser / build-info
 */
export function collectDiagnosticsReport(
  input: DiagnosticsCollectInput,
): DiagnosticsReport {
  const device =
    input.activeDevice === null
      ? null
      : ({
          id: input.activeDevice.id,
          name: input.activeDevice.name,
          providerId: input.activeDevice.providerId,
          providerLabel: input.activeDevice.providerLabel,
          chipFamily: input.activeDevice.chipFamily,
          chipRawName: input.deviceMetadata?.espToolChipName ?? null,
          status: input.activeDevice.status,
          transportLabel: input.activeDevice.transportLabel ?? null,
          capabilities: input.activeDevice.capabilities,
          chipRevision: null,
          flashSize: null,
          flashManufacturer: null,
          filesystemType: input.activeDevice.capabilities.filesystem
            ? null
            : "unsupported",
        } satisfies DiagnosticsDeviceInfo);

  const recentErrors: DiagnosticsErrorEntry[] = [];
  if (input.errorMessage !== null && input.errorMessage.length > 0) {
    recentErrors.push({
      source: "device-ui",
      kind: input.errorKind,
      message: input.errorMessage,
    });
  }

  return {
    schemaVersion: DIAGNOSTICS_REPORT_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    application: input.application,
    browser: input.browser,
    device,
    firmware: {
      recentProjectId: input.recentProjectId,
      recentProjectName: input.recentProjectName,
      recentRepository: input.recentRepository,
      version: null,
      note: "Recent library selection only — not verified against on-device firmware.",
    },
    connection: {
      webSerialSupported: input.webSerialSupported,
      isConnecting: input.isConnecting,
      isDisconnecting: input.isDisconnecting,
      errorKind: input.errorKind,
      errorMessage: input.errorMessage,
    },
    recentErrors,
  };
}

/**
 * Pretty-prints a diagnostics report as JSON text.
 *
 * @param report - Report to serialize
 */
export function serializeDiagnosticsReport(report: DiagnosticsReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
