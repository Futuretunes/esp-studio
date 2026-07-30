/**
 * Sentinel Node placeholder profile.
 */

import { Shield } from "lucide-react";

import { createPlaceholderFirmwareProfile } from "@/features/profiles/profiles/create-placeholder-profile";

export const sentinelNodeProfile = createPlaceholderFirmwareProfile({
  id: "sentinel-node",
  name: "Sentinel Node",
  projectId: "sentinel-node",
  icon: Shield,
  priority: 50,
  matchNames: ["sentinel"],
});
