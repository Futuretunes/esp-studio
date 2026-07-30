import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GITHUB_ASSET_PROXY_PATH,
  GITHUB_ASSET_PROXY_UNAVAILABLE_MESSAGE,
  downloadAssetBytes,
  resolveGitHubAssetDownloadUrl,
} from "@/features/firmware/providers/github/GitHubApi";
import { isGitHubFirmwareProviderError } from "@/features/firmware/providers/github/errors";

afterEach(() => {
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

describe("downloadAssetBytes proxy failures", () => {
  it("maps proxy HTTP 404 to proxy-unavailable with an honest message", async () => {
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
      expect(error.message).toContain(GITHUB_ASSET_PROXY_UNAVAILABLE_MESSAGE);
      expect(error.message).toContain("tasmota.bin");
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
    });
  });
});
