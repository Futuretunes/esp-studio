import type { JSX } from "react";

import { FeaturePlaceholder } from "@/components/feature-placeholder";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AboutBuildInfo } from "@/features/settings/about-build-info";
import { useUiStore } from "@/store";

export function SettingsFeature(): JSX.Element {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Theme and about information for this browser session."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose light, dark, or follow your system setting. Preference
              applies for this session only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Theme"
            >
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
          </CardContent>
        </Card>
        <AboutBuildInfo />
        <FeaturePlaceholder
          title="Advanced preferences"
          description="Serial defaults, flash profiles, and developer options will be configurable here."
        />
      </div>
    </div>
  );
}
