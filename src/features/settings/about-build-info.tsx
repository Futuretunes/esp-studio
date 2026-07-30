import { useEffect, useState, type JSX } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FALLBACK_BUILD_INFO,
  formatBuiltAtLabel,
  formatCommitLabel,
  loadBuildInfo,
  type BuildInfo,
} from "@/lib/build-info";

/**
 * About card: version, commit, and build timestamp from `/build.json`.
 */
export function AboutBuildInfo(): JSX.Element {
  const [info, setInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadBuildInfo().then((next) => {
      if (!cancelled) {
        setInfo(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const display = info ?? FALLBACK_BUILD_INFO;
  const loading = info === null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
        <CardDescription>
          Build metadata for this ESP Studio deployment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-xs">Version</dt>
              <dd className="font-mono text-sm font-medium">{display.version}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Commit</dt>
              <dd className="font-mono text-sm font-medium">
                {formatCommitLabel(display.commit)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Built</dt>
              <dd className="text-sm font-medium">
                {formatBuiltAtLabel(display.builtAt)}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
