import type { LogEntry } from '../types';

// Regex patterns for sensitive data
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const IPV4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g;
const IPV6_REGEX = /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g;
const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/g;
const JWT_TOKEN_REGEX = /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;

/**
 * Anonymize sensitive data in a plain string (log line or raw message).
 */
export function anonymizeString(text: string): string {
  if (!text) return text;
  return text
    .replace(JWT_TOKEN_REGEX, '[TOKEN_REDACTED]')
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .replace(UUID_REGEX, '[UUID_REDACTED]')
    .replace(IPV4_REGEX, (match) => {
      // Don't redact common localhost / default bind IPs
      if (match.startsWith('0.0.0.0') || match.startsWith('127.0.0.1')) return match;
      return '[IP_REDACTED]';
    })
    .replace(IPV6_REGEX, '[IP_REDACTED]');
}

/**
 * Deep clone and redact string values in a MongoDB query command object
 * while keeping keys, operators ($match, $gte, etc.), structure, and numbers intact.
 */
export function anonymizeCommandObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // If it's a regex or string with email/IP, sanitize it
    let sanitized = anonymizeString(obj);
    // If it looks like a long string or identifier, mask it
    if (sanitized === obj && obj.length > 3 && !obj.startsWith('$')) {
      return '***';
    }
    return sanitized;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => anonymizeCommandObject(item));
  }

  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('$')) {
        // Operators preserved
        res[k] = anonymizeCommandObject(v);
      } else {
        // Property names kept, values sanitized
        res[k] = anonymizeCommandObject(v);
      }
    }
    return res;
  }

  return obj;
}

/**
 * Returns a fully sanitized copy of a LogEntry.
 */
export function anonymizeLogEntry(entry: LogEntry): LogEntry {
  const sanitizedRaw = anonymizeString(entry.raw);
  const sanitizedMsg = anonymizeString(entry.message);
  const sanitizedRemote = entry.remote ? '[IP_REDACTED]' : undefined;
  const sanitizedError = entry.error ? anonymizeString(entry.error) : undefined;
  const sanitizedCommand = entry.command ? anonymizeCommandObject(entry.command) : undefined;
  const sanitizedCommandStr = sanitizedCommand ? JSON.stringify(sanitizedCommand) : (entry.commandStr ? anonymizeString(entry.commandStr) : undefined);

  return {
    ...entry,
    raw: sanitizedRaw,
    message: sanitizedMsg,
    remote: sanitizedRemote,
    error: sanitizedError,
    command: sanitizedCommand,
    commandStr: sanitizedCommandStr,
  };
}
