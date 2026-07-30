import type { JSX } from "react";

import { NAV_ITEMS } from "@/app/navigation";
import { PageHeader } from "@/components/page-header";
import { DashboardCard } from "@/features/dashboard/dashboard-card";

const DASHBOARD_CARD_IDS = [
  "devices",
  "flash",
  "firmware",
  "serial",
  "filesystem",
  "ota",
  "settings",
] as const;

export function DashboardFeature(): JSX.Element {
  const cards = DASHBOARD_CARD_IDS.map((id) => {
    const item = NAV_ITEMS.find((navItem) => navItem.id === id);
    if (!item) {
      throw new Error(`Missing navigation item for dashboard card: ${id}`);
    }
    return item;
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome to ESP Studio. Choose a tool to get started with ESP8266 and ESP32 development."
      />

      <div className="border-border from-primary/10 via-card to-card mb-8 rounded-xl border bg-gradient-to-br p-5 sm:p-6">
        <p className="text-primary text-sm font-medium">Getting started</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">
          Connect a device, then flash, monitor, and manage firmware
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          This foundation ships routing, layout, and feature modules. Web Serial
          and flashing will land in a later milestone.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <DashboardCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
