/**
 * Same-origin proxy for GitHub release asset downloads (browser CORS bypass).
 *
 * GitHub release CDNs do not send Access-Control-Allow-Origin, so browser
 * `fetch` of `browser_download_url` fails. During `pnpm dev` / `pnpm preview`,
 * this middleware downloads server-side and streams bytes to the SPA.
 */

import type { Connect, Plugin } from "vite";

/** Same-origin path used by {@link import("@/features/firmware/providers/github/GitHubApi").downloadAssetBytes}. */
export const GITHUB_ASSET_PROXY_PATH = "/__esp-studio/github-asset" as const;

const ALLOWED_HOST_SUFFIXES = [
  "github.com",
  "githubusercontent.com",
] as const;

/**
 * Returns whether a URL may be fetched through the GitHub asset proxy.
 *
 * @param value - Absolute URL string
 */
export function isAllowedGitHubAssetUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

function createProxyMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const rawUrl = req.url ?? "";
    if (!rawUrl.startsWith(GITHUB_ASSET_PROXY_PATH)) {
      next();
      return;
    }

    void (async () => {
      try {
        const requestUrl = new URL(rawUrl, "http://localhost");
        const target = requestUrl.searchParams.get("url");

        if (target === null || !isAllowedGitHubAssetUrl(target)) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Invalid or disallowed GitHub asset URL.");
          return;
        }

        const upstream = await fetch(target, {
          headers: {
            Accept: "application/octet-stream",
            "User-Agent": "ESP-Studio",
          },
          redirect: "follow",
        });

        if (!upstream.ok) {
          res.statusCode = upstream.status;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(
            `Upstream GitHub asset returned HTTP ${String(upstream.status)}.`,
          );
          return;
        }

        const contentType =
          upstream.headers.get("content-type") ?? "application/octet-stream";
        const contentLength = upstream.headers.get("content-length");

        res.statusCode = 200;
        res.setHeader("Content-Type", contentType);
        if (contentLength !== null) {
          res.setHeader("Content-Length", contentLength);
        }
        res.setHeader("Cache-Control", "no-store");

        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.end(buffer);
      } catch (error) {
        res.statusCode = 502;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(
          error instanceof Error
            ? `GitHub asset proxy failed: ${error.message}`
            : "GitHub asset proxy failed.",
        );
      }
    })();
  };
}

/**
 * Vite plugin that serves {@link GITHUB_ASSET_PROXY_PATH} in dev and preview.
 */
export function githubAssetProxyPlugin(): Plugin {
  const middleware = createProxyMiddleware();

  return {
    name: "esp-studio-github-asset-proxy",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
