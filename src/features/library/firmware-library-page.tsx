import { useEffect, useMemo, useState, type JSX } from "react";
import { Construction, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  loadBuiltInCatalog,
  type BuiltInCatalogEntry,
} from "@/features/firmware/catalog";
import { FirmwareCard } from "@/features/library/firmware-card";
import { FirmwareCategoryFilter } from "@/features/library/firmware-category";
import {
  readRecentFirmwareIds,
  rememberRecentFirmwareId,
} from "@/features/library/recent";
import {
  filterFirmwareLibraryEntries,
  resolveRecentFirmwareEntries,
  selectPopularFirmwareEntries,
  type FirmwareLibraryCategoryFilter,
} from "@/features/library/search";

/**
 * Firmware Library browse page — discover projects and launch one-click install.
 */
export function FirmwareLibraryPage(): JSX.Element {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<readonly BuiltInCatalogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<FirmwareLibraryCategoryFilter>("all");
  const [recentIds, setRecentIds] = useState<readonly string[]>(() =>
    readRecentFirmwareIds(),
  );

  useEffect(() => {
    let cancelled = false;
    void loadBuiltInCatalog()
      .then((next) => {
        if (!cancelled) {
          setEntries(next);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load the firmware library.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => filterFirmwareLibraryEntries(entries, query, category),
    [category, entries, query],
  );
  const popular = useMemo(
    () => selectPopularFirmwareEntries(filtered),
    [filtered],
  );
  const recent = useMemo(
    () => resolveRecentFirmwareEntries(entries, recentIds),
    [entries, recentIds],
  );
  const recentVisible = useMemo(
    () =>
      filterFirmwareLibraryEntries(recent, query, category),
    [category, query, recent],
  );

  const handleInstall = (entry: BuiltInCatalogEntry): void => {
    rememberRecentFirmwareId(entry.id);
    setRecentIds(readRecentFirmwareIds());
    void navigate(`/flash?project=${encodeURIComponent(entry.id)}`);
  };

  return (
    <div>
      <PageHeader
        title="Firmware Library"
        description="Browse popular ESP firmware and install with the existing one-click Flash flow."
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search name, description, repository, or chip…"
              className="pl-9"
              aria-label="Search firmware library"
            />
          </div>
        </div>

        <FirmwareCategoryFilter value={category} onChange={setCategory} />

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Library unavailable</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : null}

        {!isLoading && !loadError ? (
          <>
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Popular firmware
                </h2>
                <p className="text-muted-foreground text-sm">
                  Featured projects from the built-in catalog.
                </p>
              </div>
              {popular.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No popular projects match this search.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {popular.map((entry) => (
                    <FirmwareCard
                      key={entry.id}
                      entry={entry}
                      onInstall={handleInstall}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Recently used
                </h2>
                <p className="text-muted-foreground text-sm">
                  Projects you opened for install on this browser.
                </p>
              </div>
              {recentVisible.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Install a project to populate this list.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {recentVisible.map((entry) => (
                    <FirmwareCard
                      key={`recent-${entry.id}`}
                      entry={entry}
                      onInstall={handleInstall}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  All matching projects
                </h2>
                <p className="text-muted-foreground text-sm">
                  Full catalog results for the current search and category.
                </p>
              </div>
              {filtered.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No firmware matches. Try another search or category.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((entry) => (
                    <FirmwareCard
                      key={`all-${entry.id}`}
                      entry={entry}
                      onInstall={handleInstall}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Installed history
                </h2>
                <p className="text-muted-foreground text-sm">
                  Successful flash history will be tracked in a later release.
                </p>
              </div>
              <Card className="border-dashed">
                <CardHeader>
                  <div className="bg-muted text-muted-foreground mb-2 flex size-10 items-center justify-center rounded-lg">
                    <Construction className="size-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base">Coming soon</CardTitle>
                  <CardDescription>
                    After a successful install, project and version history will
                    appear here. Use Recently used for browser-local shortcuts
                    today.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">
                    No install history is recorded yet.
                  </p>
                </CardContent>
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
