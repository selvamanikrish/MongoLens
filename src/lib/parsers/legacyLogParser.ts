import type { LogEntry } from '../../types';
import {
  normalizeSeverity,
  parseDurationMs,
  extractNamespaceDetails,
  extractConnectionId,
} from './attributeExtractor';

// Regex for classic MongoDB format:
// 2026-08-17T14:27:21.930+0700 I COMMAND [conn1428] message ... 8420ms
const LEGACY_HEADER_REGEX = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{4}|Z)?)\s+([FEWID])\s+([A-Z_-]+)\s+\[([^\]]+)\]\s+(.*)$/i;

// Fallback simpler timestamp regex:
// 2026-08-17 14:27:21.930 [conn1428] ...
const ALT_HEADER_REGEX = /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\s+(?:\[([^\]]+)\]\s+)?(.*)$/i;

export function parseLegacyLogLine(line: string, lineNumber: number, idPrefix = 'log'): LogEntry {
  const trimmed = line.trim();
  let timestamp = '';
  let parsedDate = Date.now();
  let severity = normalizeSeverity('I');
  let component = 'GENERAL';
  let context = 'main';
  let body = trimmed;

  const match = trimmed.match(LEGACY_HEADER_REGEX);
  if (match) {
    timestamp = match[1];
    severity = normalizeSeverity(match[2]);
    component = match[3].toUpperCase();
    context = match[4];
    body = match[5];
  } else {
    const altMatch = trimmed.match(ALT_HEADER_REGEX);
    if (altMatch) {
      timestamp = altMatch[1];
      context = altMatch[2] || 'main';
      body = altMatch[3];
      if (body.toLowerCase().includes('error') || body.toLowerCase().includes('exception') || body.toLowerCase().includes('failed')) {
        severity = normalizeSeverity('E');
      } else if (body.toLowerCase().includes('warning') || body.toLowerCase().includes('warn')) {
        severity = normalizeSeverity('W');
      }
    }
  }

  if (timestamp) {
    const d = Date.parse(timestamp);
    if (!isNaN(d)) parsedDate = d;
  }

  // Duration extraction: e.g. "8420ms" or "1.24s" usually at the end of the line
  let durationMillis: number | undefined;
  const durationMatch = body.match(/(\d+(?:\.\d+)?)\s*(ms|s|m)(?:\s*$|\s+locks:)/i);
  if (durationMatch) {
    durationMillis = parseDurationMs(durationMatch[0]);
  }

  // Namespace extraction: e.g. "command db.coll" or "query db.coll" or "ns:db.coll"
  let namespace: string | undefined;
  const nsMatch = body.match(/(?:command|query|insert|update|remove|getmore|aggregate|count|distinct|ns:?)\s+([a-zA-Z0-9_$-]+\.[a-zA-Z0-9_$-]+)/i);
  if (nsMatch) {
    namespace = nsMatch[1];
  }

  const { database, collection } = extractNamespaceDetails(namespace);

  // Operation extraction
  let operation = 'command';
  const opMatch = body.match(/\b(find|aggregate|update|insert|delete|remove|count|distinct|getMore|findAndModify|createIndexes|drop)\b/i);
  if (opMatch) {
    operation = opMatch[1].toLowerCase();
    if (operation === 'remove') operation = 'delete';
  }

  // Plan summary
  let planSummary: string | undefined;
  const planMatch = body.match(/planSummary:\s*([A-Z_]+(?:\s+[A-Z_]+)*)/i);
  if (planMatch) {
    planSummary = planMatch[1].trim();
  }

  // Metrics: keysExamined, docsExamined, nreturned, numYields
  const keysExaminedMatch = body.match(/keysExamined:(\d+)/i);
  const docsExaminedMatch = body.match(/docsExamined:(\d+)/i);
  const nReturnedMatch = body.match(/nreturned:(\d+)/i);
  const numYieldsMatch = body.match(/numYields:(\d+)/i);

  const keysExamined = keysExaminedMatch ? parseInt(keysExaminedMatch[1], 10) : undefined;
  const docsExamined = docsExaminedMatch ? parseInt(docsExaminedMatch[1], 10) : undefined;
  const nReturned = nReturnedMatch ? parseInt(nReturnedMatch[1], 10) : undefined;
  const numYields = numYieldsMatch ? parseInt(numYieldsMatch[1], 10) : undefined;

  // Command snippet extraction (extract JSON-like block if present)
  let commandStr: string | undefined;
  let command: Record<string, any> | undefined;
  const jsonBlockMatch = body.match(/(\{.*\})/);
  if (jsonBlockMatch) {
    commandStr = jsonBlockMatch[1];
    try {
      command = JSON.parse(commandStr);
    } catch {
      // It might be relaxed/BSON text, keep as string
    }
  }

  // Remote address
  let remote: string | undefined;
  const remoteMatch = body.match(/remote:\s*([0-9a-fA-F:.]+)/i);
  if (remoteMatch) {
    remote = remoteMatch[1];
  }

  // Error detection
  let error: string | undefined;
  let errorCode: number | undefined;
  if (severity === 'E' || severity === 'F' || body.toLowerCase().includes('error') || body.toLowerCase().includes('exception')) {
    error = body;
    const errCodeMatch = body.match(/(?:code|codeName|error:)\s*:?\s*(\d+)/i);
    if (errCodeMatch) errorCode = parseInt(errCodeMatch[1], 10);
  }

  const connectionId = extractConnectionId(context);
  const isSlowQuery = (durationMillis !== undefined && durationMillis >= 100) || 
                      body.toLowerCase().includes('slow query');
  const isError = severity === 'E' || severity === 'F' || !!error;
  const isWarning = severity === 'W';

  return {
    id: `${idPrefix}-${lineNumber}`,
    lineNumber,
    timestamp: timestamp || new Date(parsedDate).toISOString(),
    parsedDate,
    severity,
    component,
    context,
    message: body.length > 120 ? body.substring(0, 120) + '...' : body,
    raw: trimmed,
    namespace,
    database,
    collection,
    operation,
    durationMillis,
    planSummary,
    keysExamined,
    docsExamined,
    nReturned,
    numYields,
    remote,
    connectionId,
    command,
    commandStr,
    error,
    errorCode,
    isSlowQuery,
    isError,
    isWarning,
  };
}
