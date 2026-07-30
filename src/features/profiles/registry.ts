/**
 * Device Profile registry — compiled-in profiles ordered by priority.
 */

import type {
  DeviceProfile,
  DeviceProfileMatchContext,
  MatchedDeviceProfile,
} from "@/features/profiles/types";
import { genericEspProfile } from "@/features/profiles/profiles/generic-esp";
import { esphomeProfile } from "@/features/profiles/profiles/esphome";
import { openMqttGatewayProfile } from "@/features/profiles/profiles/openmqttgateway";
import { sentinelNodeProfile } from "@/features/profiles/profiles/sentinel-node";
import { tasmotaProfile } from "@/features/profiles/profiles/tasmota";
import { wledProfile } from "@/features/profiles/profiles/wled";

/**
 * All compiled-in profiles (Generic ESP last by priority).
 */
export const DEVICE_PROFILES: readonly DeviceProfile[] = [
  sentinelNodeProfile,
  wledProfile,
  esphomeProfile,
  tasmotaProfile,
  openMqttGatewayProfile,
  genericEspProfile,
];

/**
 * Looks up a profile by id.
 *
 * @param id - Profile id
 */
export function getDeviceProfileById(id: string): DeviceProfile | undefined {
  return DEVICE_PROFILES.find((profile) => profile.id === id);
}

/**
 * Returns every profile that matches `context`, highest priority first.
 *
 * @param context - Device match facts
 */
export function listMatchingDeviceProfiles(
  context: DeviceProfileMatchContext,
): readonly DeviceProfile[] {
  return DEVICE_PROFILES.filter((profile) => profile.match(context)).sort(
    (left, right) => right.priority - left.priority,
  );
}

/**
 * Selects the best matching profile (always at least Generic ESP).
 *
 * @param context - Device match facts
 */
export function resolveDeviceProfile(
  context: DeviceProfileMatchContext,
): MatchedDeviceProfile {
  const matches = listMatchingDeviceProfiles(context);
  const profile = matches[0] ?? genericEspProfile;
  return {
    profile,
    isGeneric: profile.id === genericEspProfile.id,
    context,
  };
}
