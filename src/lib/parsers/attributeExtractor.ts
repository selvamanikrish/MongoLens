import type { LogSeverity } from '../../types';

export function normalizeSeverity(s: string | undefined): LogSeverity {
  if (!s) return 'UNKNOWN';
  const upper = s.toUpperCase();
  if (upper === 'F' || upper === 'FATAL') return 'F';
  if (upper === 'E' || upper === 'ERROR') return 'E';
  if (upper === 'W' || upper === 'WARNING' || upper === 'WARN') return 'W';
  if (upper === 'I' || upper === 'INFO' || upper === 'INFORMATIONAL') return 'I';
  if (upper.startsWith('D')) return 'D';
  return 'UNKNOWN';
}

export function parseDurationMs(val: any): number | undefined {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const match = val.match(/([\d.]+)\s*(ms|s|m|h)?/i);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = (match[2] || 'ms').toLowerCase();
      if (unit === 's') return Math.round(num * 1000);
      if (unit === 'm') return Math.round(num * 60000);
      if (unit === 'h') return Math.round(num * 3600000);
      return Math.round(num);
    }
  }
  return undefined;
}

export function extractNamespaceDetails(ns?: string): { database?: string; collection?: string } {
  if (!ns || ns === 'admin' || ns === 'local' || ns === 'config') {
    return { database: ns };
  }
  const dotIdx = ns.indexOf('.');
  if (dotIdx > 0) {
    return {
      database: ns.substring(0, dotIdx),
      collection: ns.substring(dotIdx + 1),
    };
  }
  return { database: ns };
}

export function extractOperationFromCommand(cmd: any, explicitOp?: string): string {
  if (explicitOp) return explicitOp.toLowerCase();
  if (!cmd || typeof cmd !== 'object') return 'command';

  const knownOps = [
    'find',
    'aggregate',
    'update',
    'insert',
    'delete',
    'count',
    'distinct',
    'findAndModify',
    'getMore',
    'createIndexes',
    'dropIndexes',
    'collMod',
    'drop',
    'dropDatabase',
    'listCollections',
    'listIndexes',
    'isMaster',
    'hello',
    'ping',
    'saslStart',
    'saslContinue',
    'authenticate'
  ];

  for (const op of knownOps) {
    if (cmd[op] !== undefined) {
      return op;
    }
  }

  // fallback to first key that is not generic
  const keys = Object.keys(cmd);
  if (keys.length > 0) {
    return keys[0];
  }

  return 'command';
}

export function extractConnectionId(ctx?: string): number | undefined {
  if (!ctx) return undefined;
  const match = ctx.match(/conn(\d+)/i);
  return match ? parseInt(match[1], 10) : undefined;
}
