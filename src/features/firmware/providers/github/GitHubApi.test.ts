import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GITHUB_ASSET_PROXY_PATH,
  STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE,
  downloadAssetBytes,
  isGitHubAssetProxyAvailable,
  resetGitHubAssetProxyAvailabilityCache,
  resolveGitHubAssetDownloadUrl,
} from "@/features/firmware/providers/github/GitHubApi";
import { isGitHubFirmwareProviderError } from "@/features/firmware/providers/github/errors";

afterEach(() => {
  resetGitHubAssetProxyAvailabilityCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("resolveGitHubAssetDownloadUrl", () => {
  it("rewrites through the same-origin proxy in a browser-like runtime", () => {
    vi.stubGlobal("window", {});
    const upstream =
      "https://github.com/wled-dev/WLED/releases/download/v16.0.1/firmware.bin";
    expect(resolveGitHubAssetDownloadUrl(upstream)).toBe(
      `${GITHUB_ASSET_PROXY_PATH}?url=${encodeURIComponent(upstream)}`,
    );
  });
});

describe("isGitHubAssetProxyAvailable", () => {
  it("treats HTTP 400 from the probe as proxy available", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Invalid or disallowed GitHub asset URL.", {
          status: 400,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      ),
    );

    await expect(isGitHubAssetProxyAvailable()).resolves.toBe(true);
  });

  it("treats HTTP 404 from the probe as proxy unavailable", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    await expect(isGitHubAssetProxyAvailable()).resolves.toBe(false);
  });

  it("treats HTML SPA fallback as proxy unavailable", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!doctype html><html></html>", {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      ),
    );

    await expect(isGitHubAssetProxyAvailable()).resolves.toBe(false);
  });
});

describe("downloadAssetBytes proxy failures", () => {
  it("maps proxy HTTP 404 to proxy-unavailable with static-host copy", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    await expect(
      downloadAssetBytes(
        "https://github.com/arendst/Tasmota/releases/download/v15.5.0/tasmota.bin",
        "tasmota.bin",
      ),
    ).rejects.toSatisfy((error: unknown) => {
      expect(isGitHubFirmwareProviderError(error)).toBe(true);
      if (!isGitHubFirmwareProviderError(error)) {
        return false;
      }
      expect(error.code).toBe("proxy-unavailable");
      expect(error.message).toBe(STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE);
      return true;
    });
  });

  it("maps HTML SPA fallback responses to proxy-unavailable", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<!doctype html><html></html>", {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      ),
    );

    await expect(
      downloadAssetBytes(
        "https://github.com/wled-dev/WLED/releases/download/v16.0.1/WLED.bin",
        "WLED.bin",
      ),
    ).rejects.toMatchObject({
      code: "proxy-unavailable",
      message: STATIC_HOST_GITHUB_DOWNLOAD_MESSAGE,
    });
  });
});
