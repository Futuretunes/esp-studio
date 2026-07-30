/**
 * OpenMQTTGateway placeholder profile.
 */

import { Radio } from "lucide-react";

import { createPlaceholderFirmwareProfile } from "@/features/profiles/profiles/create-placeholder-profile";

export const openMqttGatewayProfile = createPlaceholderFirmwareProfile({
  id: "openmqttgateway",
  name: "OpenMQTTGateway",
  projectId: "openmqttgateway",
  icon: Radio,
  priority: 35,
  matchNames: ["omg", "openmqtt"],
});
