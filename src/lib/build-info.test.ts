import { describe, expect, it } from "vitest";

import {
  FALLBACK_BUILD_INFO,
  formatBuiltAtLabel,
  formatCommitLabel,
  isBuildInfo,
} from "@/lib/build-info";

describe("isBuildInfo", () => {
  it("accepts a valid payload", () => {
    expect(
      isBuildInfo({
        version: "0.1.0",
        commit: "abc1234",
        builtAt: "2026-07-30T12:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("rejects incomplete payloads", () => {
    expect(isBuildInfo({ version: "0.1.0" })).toBe(false);
    expect(isBuildInfo(null)).toBe(false);
  });
});

describe("formatCommitLabel", () => {
  it("shortens long SHAs", () => {
    expect(formatCommitLabel("abcdef0123456789")).toBe("abcdef0");
  });

  it("keeps development label", () => {
    expect(formatCommitLabel("development")).toBe("development");
  });
});

describe("formatBuiltAtLabel", () => {
  it("returns Unknown for the fallback epoch", () => {
    expect(formatBuiltAtLabel(FALLBACK_BUILD_INFO.builtAt)).toBe("Unknown");
  });

  it("formats a valid ISO timestamp", () => {
    const label = formatBuiltAtLabel("2026-07-30T15:00:00.000Z");
    expect(label).not.toBe("Unknown");
    expect(label.length).toBeGreaterThan(0);
  });
});
