import { describe, expect, it } from "vitest";

import {
  buildSpiffsImage,
  extractSpiffsFiles,
} from "@/adapters/filesystem/spiffs-image";

describe("spiffs-image round trip", () => {
  it("rebuilds an image that extracts the same file bytes", () => {
    const payload = new TextEncoder().encode("hello esp studio");
    const files = new Map<string, Uint8Array>([["/config.json", payload]]);
    const image = buildSpiffsImage(files, 64 * 1024);
    const extracted = extractSpiffsFiles(image);

    expect(extracted.has("/config.json")).toBe(true);
    expect([...extracted.get("/config.json") ?? []]).toEqual([...payload]);
  });

  it("preserves multiple files across rebuild", () => {
    const files = new Map<string, Uint8Array>([
      ["/a.txt", new TextEncoder().encode("aaa")],
      ["/dir/b.txt", new TextEncoder().encode("bbbb")],
    ]);
    const image = buildSpiffsImage(files, 128 * 1024);
    const extracted = extractSpiffsFiles(image);

    expect(extracted.size).toBe(2);
    expect(new TextDecoder().decode(extracted.get("/a.txt"))).toBe("aaa");
    expect(new TextDecoder().decode(extracted.get("/dir/b.txt"))).toBe(
      "bbbb",
    );
  });

  it("supports empty files", () => {
    const files = new Map<string, Uint8Array>([["/empty", new Uint8Array()]]);
    const image = buildSpiffsImage(files, 64 * 1024);
    const extracted = extractSpiffsFiles(image);
    expect(extracted.get("/empty")?.byteLength).toBe(0);
  });
});
