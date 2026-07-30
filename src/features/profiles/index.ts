/**
 * Device Profiles feature — compiled-in profile registry + device dashboard.
 *
 * @packageDocumentation
 */

export { DeviceDashboard } from "./device-dashboard";
export {
  createProfileMatchContext,
  profileChipLabel,
  profileFirmwareName,
  profileFirmwareProjectId,
  profileFirmwareVersion,
  profileFlashSize,
  profileFilesystemFormat,
  PROFILE_METADATA_KEYS,
  readProfileMetadata,
  recentIncludesProject,
} from "./profile-metadata";
export {
  DEVICE_PROFILES,
  getDeviceProfileById,
  listMatchingDeviceProfiles,
  resolveDeviceProfile,
} from "./registry";
export { GENERIC_ESP_PROFILE_ID, genericEspProfile } from "./profiles/generic-esp";
export { useMatchedDeviceProfile } from "./use-matched-device-profile";
export type {
  DeviceProfile,
  DeviceProfileAction,
  DeviceProfileDashboardCard,
  DeviceProfileDashboardField,
  DeviceProfileDiagnosticsSection,
  DeviceProfileFilesystemAction,
  DeviceProfileMatchContext,
  DeviceProfileSettingsSection,
  MatchedDeviceProfile,
} from "./types";
