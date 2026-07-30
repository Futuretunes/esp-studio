/**
 * Device Diagnostics feature — support report inspect + export.
 *
 * @packageDocumentation
 */

export {
  copyDiagnosticsReport,
  DIAGNOSTICS_EXPORT_FILENAME,
  downloadDiagnosticsReport,
} from "./diagnostics-export";
export {
  DiagnosticsCard,
  DiagnosticsField,
  DiagnosticsStatusBadge,
  diagnosticsDisplayValue,
} from "./diagnostics-card";
export { DiagnosticsPage } from "./diagnostics-page";
export {
  DIAGNOSTICS_REPORT_SCHEMA_VERSION,
  collectDiagnosticsReport,
  serializeDiagnosticsReport,
  type DiagnosticsBrowserInfo,
  type DiagnosticsCollectInput,
  type DiagnosticsConnectionInfo,
  type DiagnosticsDeviceInfo,
  type DiagnosticsErrorEntry,
  type DiagnosticsFirmwareInfo,
  type DiagnosticsReport,
} from "./diagnostics-report";
