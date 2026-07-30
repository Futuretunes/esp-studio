/**
 * Tasmota placeholder profile.
 */

import { CircuitBoard } from "lucide-react";

import { createPlaceholderFirmwareProfile } from "@/features/profiles/profiles/create-placeholder-profile";

export const tasmotaProfile = createPlaceholderFirmwareProfile({
  id: "tasmota",
  name: "Tasmota",
  projectId: "tasmota",
  icon: CircuitBoard,
  priority: 40,
});
