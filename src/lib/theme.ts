/**
 * Theme preference persistence and document class application.
 */

import type { AppTheme } from "@/types";

/** localStorage key for the user's appearance preference. */
export const THEME_STORAGE_KEY = "esp-studio.ui.theme" as const;

/**
 * Reads a previously saved theme preference.
 *
 * @returns Saved theme, or `null` when unset / unreadable
 */
export function readPersistedTheme(): AppTheme | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists a theme preference.
 *
 * @param theme - Preference to store
 */
export function persistTheme(theme: AppTheme): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

/**
 * Resolves whether the document should use the dark class for a preference.
 *
 * @param theme - Stored preference
 */
export function resolvesToDarkClass(theme: AppTheme): boolean {
  if (theme === "dark") {
    return true;
  }
  if (theme === "light") {
    return false;
  }
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Applies the dark class on `document.documentElement` for a theme preference.
 *
 * @param theme - Preference to apply
 */
export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", resolvesToDarkClass(theme));
}

/**
 * Initial theme for first paint: saved preference, else Light.
 */
export function getInitialTheme(): AppTheme {
  return readPersistedTheme() ?? "light";
}

/**
 * Applies the initial theme before React mounts (avoids a dark flash).
 */
export function applyStoredTheme(): void {
  applyThemeToDocument(getInitialTheme());
}
