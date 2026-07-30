/**
 * ESPHome placeholder profile.
 */

import { Home } from "lucide-react";

import { createPlaceholderFirmwareProfile } from "@/features/profiles/profiles/create-placeholder-profile";

export const esphomeProfile = createPlaceholderFirmwareProfile({
  id: "esphome",
  name: "ESPHome",
  projectId: "esphome",
  icon: Home,
  priority: 40,
});
