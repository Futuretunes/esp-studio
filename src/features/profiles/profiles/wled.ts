/**
 * WLED placeholder profile.
 */

import { Lightbulb } from "lucide-react";

import { createPlaceholderFirmwareProfile } from "@/features/profiles/profiles/create-placeholder-profile";

export const wledProfile = createPlaceholderFirmwareProfile({
  id: "wled",
  name: "WLED",
  projectId: "wled",
  icon: Lightbulb,
  priority: 40,
});
