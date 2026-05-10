/**
 * Public barrel for the loan-schedule scanning pipeline. Re-exports the
 * stable surface of the {@link ./schedule-scan} sub-modules so existing
 * imports of `@/_services/finance/schedule-scan-service` keep working.
 */
export { GEMINI_SCHEDULE_MODEL, SCHEDULE_ALLOWED_MIME_TYPES } from "./schedule-scan/config";
export { checkScheduleScanRateLimit } from "./schedule-scan/rate-limit";
export { scanSchedule } from "./schedule-scan/scan";
export type {
  PrepaymentEntry,
  ScheduleData,
  ScheduleRow,
  ScheduleScanResult,
} from "./schedule-scan/types";
