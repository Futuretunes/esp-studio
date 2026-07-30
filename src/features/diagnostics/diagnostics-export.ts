/**
 * Browser download / clipboard helpers for diagnostics exports.
 */

import {
  serializeDiagnosticsReport,
  type DiagnosticsReport,
} from "@/features/diagnostics/diagnostics-report";

/**
 * Default download filename for diagnostics exports.
 */
export const DIAGNOSTICS_EXPORT_FILENAME = "diagnostics.json";

/**
 * Triggers a browser download of the diagnostics JSON.
 *
 * @param report - Report to export
 * @param filename - Optional override filename
 */
export function downloadDiagnosticsReport(
  report: DiagnosticsReport,
  filename: string = DIAGNOSTICS_EXPORT_FILENAME,
): void {
  const text = serializeDiagnosticsReport(report);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Copies diagnostics JSON to the clipboard when available.
 *
 * @param report - Report to copy
 * @returns `true` when the clipboard write succeeded
 */
export async function copyDiagnosticsReport(
  report: DiagnosticsReport,
): Promise<boolean> {
  const text = serializeDiagnosticsReport(report);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
