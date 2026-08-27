import type {
  CollectionStat,
  ErrorGroup,
  LogEntry,
  LogSummary,
  OperationStat,
  TimelineBucket,
  WorkerParseResult,
} from '../../types';

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

export function computeAnalytics(entries: LogEntry[]): WorkerParseResult {
  if (entries.length === 0) {
    return {
      entries: [],
      summary: {
        totalEntries: 0,
        slowQueriesCount: 0,
        errorsCount: 0,
        warningsCount: 0,
        infoCount: 0,
        avgDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        maxDuration: 0,
        minDuration: 0,
        timeRange: null,
        totalOperations: 0,
        uniqueCollectionsCount: 0,
        uniqueNamespaces: [],
        uniqueOperations: [],
      },
      timeline: [],
      collections: [],
      operations: [],
      errorGroups: [],
      slowQueries: [],
    };
  }

  let slowQueriesCount = 0;
  let errorsCount = 0;
  let warningsCount = 0;
  let infoCount = 0;

  const durations: number[] = [];
  const slowQueries: LogEntry[] = [];
  const namespaceMap = new Map<string, {
    database: string;
    collection: string;
    durations: number[];
    slowCount: number;
    errorCount: number;
    collscanCount: number;
    ops: Record<string, number>;
  }>();

  const opMap = new Map<string, { count: number; durations: number[]; slowCount: number }>();
  const errorMap = new Map<string, {
    message: string;
    component: string;
    severity: LogEntry['severity'];
    errorCode?: number;
    firstSeen: string;
    lastSeen: string;
    instances: LogEntry[];
  }>();

  let minDate = entries[0].parsedDate;
  let maxDate = entries[0].parsedDate;
  let minDateStr = entries[0].timestamp;
  let maxDateStr = entries[0].timestamp;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.parsedDate < minDate) {
      minDate = entry.parsedDate;
      minDateStr = entry.timestamp;
    }
    if (entry.parsedDate > maxDate) {
      maxDate = entry.parsedDate;
      maxDateStr = entry.timestamp;
    }

    if (entry.isSlowQuery) {
      slowQueriesCount++;
      slowQueries.push(entry);
    }
    if (entry.isError) errorsCount++;
    if (entry.isWarning) warningsCount++;
    if (entry.severity === 'I') infoCount++;

    if (entry.durationMillis !== undefined && entry.durationMillis !== null) {
      durations.push(entry.durationMillis);
    }

    // Namespace tracking
    if (entry.namespace) {
      let nsStat = namespaceMap.get(entry.namespace);
      if (!nsStat) {
        nsStat = {
          database: entry.database || 'default',
          collection: entry.collection || entry.namespace,
          durations: [],
          slowCount: 0,
          errorCount: 0,
          collscanCount: 0,
          ops: {},
        };
        namespaceMap.set(entry.namespace, nsStat);
      }
      if (entry.durationMillis !== undefined) {
        nsStat.durations.push(entry.durationMillis);
      }
      if (entry.isSlowQuery) nsStat.slowCount++;
      if (entry.isError) nsStat.errorCount++;
      if (entry.planSummary?.includes('COLLSCAN')) nsStat.collscanCount++;
      if (entry.operation) {
        nsStat.ops[entry.operation] = (nsStat.ops[entry.operation] || 0) + 1;
      }
    }

    // Operation tracking
    if (entry.operation) {
      let opStat = opMap.get(entry.operation);
      if (!opStat) {
        opStat = { count: 0, durations: [], slowCount: 0 };
        opMap.set(entry.operation, opStat);
      }
      opStat.count++;
      if (entry.durationMillis !== undefined) {
        opStat.durations.push(entry.durationMillis);
      }
      if (entry.isSlowQuery) opStat.slowCount++;
    }

    // Error grouping
    if (entry.isError) {
      // Normalize message for clustering
      const cleanMsg = (entry.error || entry.message || 'Unknown error')
        .replace(/\bconn\d+\b/gi, 'conn*')
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+\b/g, 'ip:port')
        .replace(/\b0x[a-fA-F0-9]+\b/g, '0x*')
        .substring(0, 150);

      const errKey = `${entry.component}|${entry.errorCode || ''}|${cleanMsg}`;
      let errGroup = errorMap.get(errKey);
      if (!errGroup) {
        errGroup = {
          message: entry.error || entry.message,
          component: entry.component,
          severity: entry.severity,
          errorCode: entry.errorCode,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          instances: [],
        };
        errorMap.set(errKey, errGroup);
      }
      errGroup.lastSeen = entry.timestamp;
      if (errGroup.instances.length < 50) {
        errGroup.instances.push(entry);
      }
    }
  }

  // Sort durations for percentiles
  durations.sort((a, b) => a - b);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const p50Duration = calculatePercentile(durations, 50);
  const p95Duration = calculatePercentile(durations, 95);
  const p99Duration = calculatePercentile(durations, 99);
  const maxDuration = durations.length > 0 ? durations[durations.length - 1] : 0;
  const minDuration = durations.length > 0 ? durations[0] : 0;

  // Build Collections
  const collections: CollectionStat[] = [];
  for (const [ns, stat] of namespaceMap.entries()) {
    stat.durations.sort((a, b) => a - b);
    const avg = stat.durations.length > 0 ? Math.round(stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length) : 0;
    const p95 = calculatePercentile(stat.durations, 95);
    const max = stat.durations.length > 0 ? stat.durations[stat.durations.length - 1] : 0;

    collections.push({
      namespace: ns,
      database: stat.database,
      collection: stat.collection,
      queriesCount: stat.durations.length || Object.values(stat.ops).reduce((a, b) => a + b, 0),
      avgDuration: avg,
      p95Duration: p95,
      maxDuration: max,
      slowQueriesCount: stat.slowCount,
      errorsCount: stat.errorCount,
      collscanCount: stat.collscanCount,
      operations: stat.ops,
    });
  }
  collections.sort((a, b) => b.queriesCount - a.queriesCount);

  // Build Operations
  const totalOpsCount = Array.from(opMap.values()).reduce((acc, v) => acc + v.count, 0) || 1;
  const operations: OperationStat[] = [];
  for (const [op, stat] of opMap.entries()) {
    stat.durations.sort((a, b) => a - b);
    const avg = stat.durations.length > 0 ? Math.round(stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length) : 0;
    const p95 = calculatePercentile(stat.durations, 95);

    operations.push({
      operation: op,
      count: stat.count,
      percentage: Number(((stat.count / totalOpsCount) * 100).toFixed(1)),
      avgDuration: avg,
      p95Duration: p95,
      slowCount: stat.slowCount,
    });
  }
  operations.sort((a, b) => b.count - a.count);

  // Build Error Groups
  const errorGroups: ErrorGroup[] = [];
  let errIdx = 1;
  for (const [, group] of errorMap.entries()) {
    errorGroups.push({
      id: `err-${errIdx++}`,
      message: group.message,
      component: group.component,
      severity: group.severity,
      count: group.instances.length,
      firstSeen: group.firstSeen,
      lastSeen: group.lastSeen,
      errorCode: group.errorCode,
      instances: group.instances,
    });
  }
  errorGroups.sort((a, b) => b.count - a.count);

  // Build Timeline Buckets
  const timeSpanMs = Math.max(1000, maxDate - minDate);
  const targetBuckets = Math.min(50, Math.max(10, Math.floor(entries.length / 50)));
  const bucketInterval = Math.max(1000, Math.ceil(timeSpanMs / targetBuckets));

  const bucketsMap = new Map<number, {
    durations: number[];
    slowCount: number;
    errorCount: number;
    total: number;
  }>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const bucketKey = Math.floor((entry.parsedDate - minDate) / bucketInterval) * bucketInterval + minDate;
    let b = bucketsMap.get(bucketKey);
    if (!b) {
      b = { durations: [], slowCount: 0, errorCount: 0, total: 0 };
      bucketsMap.set(bucketKey, b);
    }
    b.total++;
    if (entry.isSlowQuery) b.slowCount++;
    if (entry.isError) b.errorCount++;
    if (entry.durationMillis !== undefined) {
      b.durations.push(entry.durationMillis);
    }
  }

  const timeline: TimelineBucket[] = [];
  const sortedBucketKeys = Array.from(bucketsMap.keys()).sort((a, b) => a - b);

  for (const key of sortedBucketKeys) {
    const b = bucketsMap.get(key)!;
    b.durations.sort((a, b) => a - b);
    const avg = b.durations.length > 0 ? Math.round(b.durations.reduce((x, y) => x + y, 0) / b.durations.length) : 0;
    const p95 = calculatePercentile(b.durations, 95);
    const p99 = calculatePercentile(b.durations, 99);

    const d = new Date(key);
    const timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;

    timeline.push({
      time: timeLabel,
      timestamp: key,
      total: b.total,
      slowCount: b.slowCount,
      errorCount: b.errorCount,
      avgDuration: avg,
      p95Duration: p95,
      p99Duration: p99,
    });
  }

  // Sort slow queries descending by duration
  slowQueries.sort((a, b) => (b.durationMillis || 0) - (a.durationMillis || 0));

  const summary: LogSummary = {
    totalEntries: entries.length,
    slowQueriesCount,
    errorsCount,
    warningsCount,
    infoCount,
    avgDuration,
    p50Duration,
    p95Duration,
    p99Duration,
    maxDuration,
    minDuration,
    timeRange: {
      start: minDateStr,
      end: maxDateStr,
      startMs: minDate,
      endMs: maxDate,
    },
    totalOperations: totalOpsCount,
    uniqueCollectionsCount: collections.length,
    uniqueNamespaces: collections.map((c) => c.namespace),
    uniqueOperations: operations.map((o) => o.operation),
  };

  return {
    entries,
    summary,
    timeline,
    collections,
    operations,
    errorGroups,
    slowQueries,
  };
}
