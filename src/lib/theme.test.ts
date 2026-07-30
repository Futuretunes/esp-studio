import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyThemeToDocument,
  getInitialTheme,
  persistTheme,
  readPersistedTheme,
  resolvesToDarkClass,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: () => null,
    get length() {
      return store.size;
    },
  });
}

beforeEach(() => {
  installMemoryLocalStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme preference", () => {
  it("defaults to light when nothing is saved", () => {
    expect(readPersistedTheme()).toBeNull();
    expect(getInitialTheme()).toBe("light");
  });

  it("persists and restores a saved preference", () => {
    persistTheme("dark");
    expect(readPersistedTheme()).toBe("dark");
    expect(getInitialTheme()).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("resolves system theme from matchMedia", () => {
    vi.stubGlobal("window", {
      matchMedia: (query: string) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });
    expect(resolvesToDarkClass("system")).toBe(true);
    expect(resolvesToDarkClass("light")).toBe(false);
  });

  it("toggles the document dark class", () => {
    const classList = {
      toggle: vi.fn(),
    };
    vi.stubGlobal("document", {
      documentElement: { classList },
    });
    applyThemeToDocument("light");
    expect(classList.toggle).toHaveBeenCalledWith("dark", false);
    applyThemeToDocument("dark");
    expect(classList.toggle).toHaveBeenCalledWith("dark", true);
  });
});
