import type { LogEntry } from '../../types';
import {
  normalizeSeverity,
  parseDurationMs,
  extractNamespaceDetails,
  extractOperationFromCommand,
  extractConnectionId,
} from './attributeExtractor';

export function parseJsonLogLine(line: string, lineNumber: number, idPrefix = 'log'): LogEntry | null {
  const trimmed = line.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.endsWith('}'))) {
    return null;
  }

  try {
    const obj = JSON.parse(trimmed);

    // Extract Timestamp
    let timestamp = '';
    let parsedDate = Date.now();
    if (obj.t) {
      if (typeof obj.t === 'object' && obj.t.$date) {
        timestamp = String(obj.t.$date);
      } else if (typeof obj.t === 'string') {
        timestamp = obj.t;
      } else if (typeof obj.t === 'number') {
        timestamp = new Date(obj.t).toISOString();
      }
      const d = Date.parse(timestamp);
      if (!isNaN(d)) parsedDate = d;
    }

    const severity = normalizeSeverity(obj.s || obj.severity || obj.level);
    const component = String(obj.c || obj.component || 'GENERAL').toUpperCase();
    const context = String(obj.ctx || obj.context || 'main');
    const message = String(obj.msg || obj.message || '');
    const attr = obj.attr || {};

    // Extract duration
    let durationMillis: number | undefined;
    if (attr.durationMillis !== undefined) {
      durationMillis = parseDurationMs(attr.durationMillis);
    } else if (obj.durationMillis !== undefined) {
      durationMillis = parseDurationMs(obj.durationMillis);
    } else if (attr.millis !== undefined) {
      durationMillis = parseDurationMs(attr.millis);
    }

    // Extract namespace
    let namespace = attr.ns || obj.ns || attr.namespace;
    if (!namespace && attr.command) {
      const db = attr.command.$db || attr.command.db;
      const coll = attr.command.collection || 
                   attr.command.find || 
                   attr.command.aggregate || 
                   attr.command.update || 
                   attr.command.insert || 
                   attr.command.delete || 
                   attr.command.count;
      if (db && typeof coll === 'string') {
        namespace = `${db}.${coll}`;
      } else if (db) {
        namespace = db;
      }
    }

    const { database, collection } = extractNamespaceDetails(namespace);

    // Extract command and operation
    const command = attr.command || obj.command || undefined;
    const explicitOp = attr.type || attr.op || obj.op;
    const operation = extractOperationFromCommand(command, explicitOp);

    // Execution metrics
    const planSummary = attr.planSummary || obj.planSummary || undefined;
    const keysExamined = attr.keysExamined !== undefined ? Number(attr.keysExamined) : undefined;
    const docsExamined = attr.docsExamined !== undefined ? Number(attr.docsExamined) : undefined;
    const nReturned = attr.nreturned !== undefined ? Number(attr.nreturned) : 
                      attr.nReturned !== undefined ? Number(attr.nReturned) : undefined;
    const keysInserted = attr.keysInserted !== undefined ? Number(attr.keysInserted) : undefined;
    const keysDeleted = attr.keysDeleted !== undefined ? Number(attr.keysDeleted) : undefined;
    const numYields = attr.numYields !== undefined ? Number(attr.numYields) : undefined;

    // Error details
    let error: string | undefined;
    let errorCode: number | undefined;
    if (attr.error) {
      if (typeof attr.error === 'object') {
        error = attr.error.errmsg || attr.error.message || JSON.stringify(attr.error);
        errorCode = attr.error.code !== undefined ? Number(attr.error.code) : undefined;
      } else {
        error = String(attr.error);
      }
    } else if (attr.errmsg) {
      error = String(attr.errmsg);
      if (attr.code !== undefined) errorCode = Number(attr.code);
    }

    const remote = attr.remote || obj.remote || undefined;
    const connectionId = extractConnectionId(context);
    const appName = attr.appName || obj.appName || undefined;

    // Classification
    const isSlowQuery = (durationMillis !== undefined && durationMillis >= 100) || 
                        message.toLowerCase().includes('slow query');
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
      message,
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
      keysInserted,
      keysDeleted,
      numYields,
      remote,
      connectionId,
      command,
      commandStr: command ? JSON.stringify(command) : undefined,
      error,
      errorCode,
      appName,
      isSlowQuery,
      isError,
      isWarning,
    };
  } catch {
    return null;
  }
}
