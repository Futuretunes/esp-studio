import { useEffect, useState, type JSX } from "react";
import {
  CircuitBoard,
  Home,
  Lightbulb,
  Radio,
  type LucideIcon,
} from "lucide-react";

import type { ChipFamily } from "@/core/device";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BuiltInCatalogEntry } from "@/features/firmware/catalog";
import {
  fetchLatestRelease,
  parseGitHubRepositorySlug,
} from "@/features/firmware/providers/github";
import { formatChipLabel } from "@/features/identification/format-chip-label";
import { FirmwareCategoryBadge } from "@/features/library/firmware-category";

const BUILTIN_ICONS: Readonly<Record<string, LucideIcon>> = {
  wled: Lightbulb,
  esphome: Home,
  tasmota: CircuitBoard,
  openmqttgateway: Radio,
};

const KNOWN_CHIP_FAMILIES = new Set<string>([
  "esp8266",
  "esp32",
  "esp32-s2",
  "esp32-s3",
  "esp32-c2",
  "esp32-c3",
  "esp32-c6",
  "esp32-h2",
  "unknown",
]);

type FirmwareCardProps = {
  entry: BuiltInCatalogEntry;
  onInstall: (entry: BuiltInCatalogEntry) => void;
};

/**
 * Firmware Library project card with lazy latest-release label.
 */
export function FirmwareCard({
  entry,
  onInstall,
}: FirmwareCardProps): JSX.Element {
  const Icon = BUILTIN_ICONS[entry.icon] ?? CircuitBoard;
  const latest = useLatestReleaseLabel(entry.repository);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{entry.name}</CardTitle>
            {entry.featured ? <Badge variant="success">Popular</Badge> : null}
            <FirmwareCategoryBadge category={entry.category} />
          </div>
          <CardDescription>{entry.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Repository</dt>
            <dd className="truncate font-mono text-xs">{entry.repository}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Latest version</dt>
            <dd className="text-sm font-medium">
              {latest.status === "loading" ? (
                <Skeleton className="h-4 w-24" />
              ) : latest.status === "ready" ? (
                latest.label
              ) : (
                <span className="text-muted-foreground">Unavailable</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground mb-1 text-xs">
              Supported chips
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {(entry.chipFamilies ?? []).length > 0 ? (
                (entry.chipFamilies ?? []).map((chip) => (
                  <Badge key={chip} variant="outline">
                    {formatChipFamilyHint(chip)}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">Any</span>
              )}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {entry.supportsGithubBinInstall === false ? (
          <>
            <p className="text-muted-foreground text-xs">
              No universal .bin on GitHub Releases — use a file you built, then
              Flash Local File.
            </p>
            <Button
              type="button"
              className="w-full"
              variant="secondary"
              onClick={() => {
                onInstall(entry);
              }}
            >
              Open in Flash
            </Button>
          </>
        ) : (
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              onInstall(entry);
            }}
          >
            Install
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

type LatestReleaseState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly label: string }
  | { readonly status: "error" };

function useLatestReleaseLabel(repository: string): LatestReleaseState {
  const [state, setState] = useState<LatestReleaseState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      try {
        const ref = parseGitHubRepositorySlug(repository);
        if (ref === null) {
          if (!cancelled) {
            setState({ status: "error" });
          }
          return;
        }
        const release = await fetchLatestRelease(ref.owner, ref.repository);
        if (cancelled) {
          return;
        }
        const label =
          release.tagName.length > 0
            ? release.tagName
            : (release.name ?? "Latest");
        setState({ status: "ready", label });
      } catch {
        if (!cancelled) {
          setState({ status: "error" });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [repository]);

  return state;
}

function formatChipFamilyHint(chip: string): string {
  if (KNOWN_CHIP_FAMILIES.has(chip)) {
    return formatChipLabel(chip as ChipFamily);
  }
  return chip.toUpperCase();
}
