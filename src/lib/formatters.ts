/**
 * Utility functions for formatting MongoDB log timestamps, dates, and time ranges.
 */

function parseDateInput(val: string | number | Date | undefined | null): Date | null {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    
    // First attempt standard Date constructor
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
    
    // Try replacing space with 'T' (e.g., "2026-08-17 14:27:21" -> "2026-08-17T14:27:21")
    if (trimmed.includes(' ') && !trimmed.includes('T')) {
      d = new Date(trimmed.replace(' ', 'T'));
      if (!isNaN(d.getTime())) return d;
    }

    // Try Date.parse
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) return new Date(parsed);
  }
  return null;
}

/**
 * Formats a timestamp into a clean "DD/MM/YYYY HH:mm:ss" string.
 * Example: "17/08/2026 14:27:21"
 */
export function formatDateTime(
  val: string | number | Date | undefined | null,
  fallback: string = 'N/A'
): string {
  const d = parseDateInput(val);
  if (!d) return typeof val === 'string' && val.trim() ? val : fallback;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

/**
 * Extracts only the date component in "DD/MM/YYYY" format.
 * Example: "17/08/2026"
 */
export function formatDate(
  val: string | number | Date | undefined | null,
  fallback: string = 'N/A'
): string {
  const d = parseDateInput(val);
  if (!d) return fallback;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Extracts only the time component in "HH:mm:ss" format.
 * Example: "14:27:21"
 */
export function formatTime(
  val: string | number | Date | undefined | null,
  fallback: string = 'N/A'
): string {
  const d = parseDateInput(val);
  if (!d) return fallback;

  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');

  return `${hh}:${min}:${ss}`;
}

/**
 * Formats a time range showing the date and time span cleanly.
 * If start and end are on the same calendar day:
 *   "2026-08-17 14:00:00 → 18:30:00"
 * If spanning across different dates:
 *   "2026-08-17 14:00:00 → 2026-08-18 09:30:00"
 */
export function formatDateTimeRange(
  startVal: string | number | Date | undefined | null,
  endVal: string | number | Date | undefined | null,
  fallback: string = 'Active Range'
): string {
  const start = parseDateInput(startVal);
  const end = parseDateInput(endVal);

  if (!start && !end) return fallback;
  if (start && !end) return formatDateTime(start);
  if (!start && end) return formatDateTime(end);

  const startDateStr = formatDate(start);
  const endDateStr = formatDate(end);
  const startTimeStr = formatTime(start);
  const endTimeStr = formatTime(end);

  if (startDateStr === endDateStr) {
    return `${startDateStr} ${startTimeStr} → ${endTimeStr}`;
  }

  return `${startDateStr} ${startTimeStr} → ${endDateStr} ${endTimeStr}`;
}
