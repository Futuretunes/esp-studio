/**
 * Device Profile contracts — compiled-in enhancements over generic ESP tooling.
 *
 * Profiles never replace Flash / Filesystem / Serial / Diagnostics services.
 * They contribute UI cards, actions, and labels. Future plugins can implement
 * the same {@link DeviceProfile} shape without a core redesign.
 */

import type { ChipFamily } from "@/core/device";
import type { LucideIcon } from "lucide-react";

/**
 * Facts available when selecting a profile for the active device.
 *
 * Built only from Device Layer metadata + lightweight local hints — never
 * invents on-device firmware identity.
 */
export type DeviceProfileMatchContext = {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly chipFamily: ChipFamily;
  /** Opaque DeviceInfo.metadata bag (chip name, flash size, optional firmware hints). */
  readonly metadata: Readonly<Record<string, string>>;
  /** Newest-first built-in catalog ids from the Firmware Library. */
  readonly recentFirmwareIds: readonly string[];
};

/**
 * One dashboard metric or label row.
 */
export type DeviceProfileDashboardField = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
};

/**
 * One primary action on the device dashboard (links to existing routes).
 */
export type DeviceProfileAction = {
  readonly id: string;
  readonly label: string;
  /** In-app path (for example `/serial`). */
  readonly href: string;
  readonly variant?: "default" | "secondary" | "outline";
};

/**
 * Dashboard contribution from a profile.
 */
export type DeviceProfileDashboardCard = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly fields: readonly DeviceProfileDashboardField[];
  readonly actions?: readonly DeviceProfileAction[];
};

/**
 * Settings contribution (placeholder for future profile-specific settings).
 */
export type DeviceProfileSettingsSection = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

/**
 * Diagnostics contribution lines (facts only — no invention).
 */
export type DeviceProfileDiagnosticsSection = {
  readonly id: string;
  readonly title: string;
  readonly lines: readonly string[];
};

/**
 * Optional filesystem action labels (links / future hooks).
 */
export type DeviceProfileFilesystemAction = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

/**
 * Compiled-in device profile.
 *
 * Match with {@link DeviceProfile.match}; higher {@link DeviceProfile.priority}
 * wins among matches (Generic ESP uses `0`).
 */
export type DeviceProfile = {
  readonly id: string;
  readonly name: string;
  readonly icon: LucideIcon;
  /** Higher wins; Generic ESP is `0`. */
  readonly priority: number;
  /**
   * Returns whether this profile applies to the device context.
   *
   * Generic ESP always returns `true`.
   */
  match(context: DeviceProfileMatchContext): boolean;
  /** Optional version constraint note for UI (not enforced unless match uses it). */
  readonly versionConstraint?: string;
  dashboardCards(
    context: DeviceProfileMatchContext,
  ): readonly DeviceProfileDashboardCard[];
  deviceActions(
    context: DeviceProfileMatchContext,
  ): readonly DeviceProfileAction[];
  settingsSections(
    context: DeviceProfileMatchContext,
  ): readonly DeviceProfileSettingsSection[];
  diagnostics(
    context: DeviceProfileMatchContext,
  ): readonly DeviceProfileDiagnosticsSection[];
  filesystemActions(
    context: DeviceProfileMatchContext,
  ): readonly DeviceProfileFilesystemAction[];
};

/**
 * Result of resolving profiles for a device.
 */
export type MatchedDeviceProfile = {
  readonly profile: DeviceProfile;
  /** True when the Generic ESP profile was selected as fallback. */
  readonly isGeneric: boolean;
  readonly context: DeviceProfileMatchContext;
};
