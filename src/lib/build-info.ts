/**
 * Build metadata loaded from `/build.json` (generated at build time).
 */

/**
 * Shape of `public/build.json` / `dist/build.json`.
 */
export type BuildInfo = {
  readonly version: string;
  readonly commit: string;
  readonly builtAt: string;
};

/**
 * Fallback when `/build.json` is missing (e.g. first `pnpm dev` before generate).
 */
export const FALLBACK_BUILD_INFO: BuildInfo = {
  version: "0.0.0-dev",
  commit: "development",
  builtAt: new Date(0).toISOString(),
};

/**
 * Type guard for {@link BuildInfo}.
 *
 * @param value - Unknown JSON payload
 */
export function isBuildInfo(value: unknown): value is BuildInfo {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.version === "string" &&
    typeof record.commit === "string" &&
    typeof record.builtAt === "string"
  );
}

/**
 * Fetches `build.json` from the deployed (or dev) origin.
 *
 * Uses Vite {@link import.meta.env.BASE_URL} so subdirectory / relative-base
 * deploys resolve correctly (not a hard-coded `/build.json`).
 */
export async function loadBuildInfo(): Promise<BuildInfo> {
  try {
    const url = `${import.meta.env.BASE_URL}build.json`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return FALLBACK_BUILD_INFO;
    }
    const payload: unknown = await response.json();
    if (!isBuildInfo(payload)) {
      return FALLBACK_BUILD_INFO;
    }
    return payload;
  } catch {
    return FALLBACK_BUILD_INFO;
  }
}

/**
 * Shortens a commit SHA for display.
 *
 * @param commit - Full or short commit id
 */
export function formatCommitLabel(commit: string): string {
  if (commit === "development" || commit.length <= 7) {
    return commit;
  }
  return commit.slice(0, 7);
}

/**
 * Formats an ISO build timestamp for the About card.
 *
 * @param builtAt - ISO-8601 string
 */
export function formatBuiltAtLabel(builtAt: string): string {
  const date = new Date(builtAt);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "Unknown";
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
