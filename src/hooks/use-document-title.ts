import { useEffect } from "react";

/**
 * Shared hooks for ESP Studio.
 * Feature-specific hooks should live under `src/features/<feature>/`.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title =
      title.trim().length > 0 ? `${title} · ESP Studio` : "ESP Studio";

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
