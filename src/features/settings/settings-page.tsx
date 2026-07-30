import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { AboutBuildInfo } from "@/features/settings/about-build-info";
import { useUiStore } from "@/store";

export function SettingsFeature(): JSX.Element {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure ESP Studio preferences for your workspace."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <FeaturePlaceholder
          title="Appearance"
          description="Dark theme is the default for the desktop-style shell. Theme preference is stored in the UI store."
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => {
                setTheme("dark");
                document.documentElement.classList.add("dark");
              }}
            >
              Dark
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => {
                setTheme("light");
                document.documentElement.classList.remove("dark");
              }}
            >
              Light
            </Button>
            <Button
              type="button"
              size="sm"
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => {
                setTheme("system");
                const prefersDark = window.matchMedia(
                  "(prefers-color-scheme: dark)",
                ).matches;
                document.documentElement.classList.toggle("dark", prefersDark);
              }}
            >
              System
            </Button>
          </div>
        </FeaturePlaceholder>
        <AboutBuildInfo />
        <FeaturePlaceholder
          title="Advanced preferences"
          description="Serial defaults, flash profiles, and developer options will be configurable here."
        />
      </div>
    </div>
  );
}
