import * as fflate from 'fflate';
import type {
  CollectionStat,
  ErrorGroup,
  LogEntry,
  LogSummary,
  OperationStat,
  ParseProgressPayload,
  TimelineBucket,
  WorkerParseResult,
} from '../types';
import { parseJsonLogLine } from '../lib/parsers/jsonLogParser';
import { parseLegacyLogLine } from '../lib/parsers/legacyLogParser';
import { extractNamespaceDetails } from '../lib/parsers/attributeExtractor';

// Maximum items to keep in RAM to guarantee 60fps and avoid browser OOM crashes on 1GB+ files
const MAX_SLOW_QUERIES_IN_MEMORY = 5000;
const MAX_RAW_LOGS_IN_MEMORY = 25000;
const DURATION_RESERVOIR_SIZE = 20000;

self.onmessage = async (e: MessageEvent) => {
  const { type, file, text, fileSize } = e.data;

  try {
    if (type === 'PARSE_FILE' && file) {
      await processStreamingFile(file);
    } else if (type === 'PARSE_TEXT' && text) {
      await processTextStream(text, fileSize || text.length);
    }
  } catch (err: any) {
    console.error('Parsing stream error:', err);
    const errorPayload: ParseProgressPayload = {
      phase: 'error',
      progress: 0,
      processedBytes: 0,
      totalBytes: 0,
      processedEntries: 0,
      processingSpeedMBps: 0,
      estimatedRemainingSeconds: 0,
      errorMessage: err?.message || 'Failed to stream and parse log file',
    };
    self.postMessage({ type: 'PROGRESS', payload: errorPayload });
  }
};

function postProgress(payload: ParseProgressPayload) {
  self.postMessage({ type: 'PROGRESS', payload });
}

function postResult(result: WorkerParseResult) {
  self.postMessage({ type: 'COMPLETE', result });
}

async function processStreamingFile(file: File) {
  const isGz = file.name.endsWith('.gz') || file.type === 'application/gzip';
  const isZip = file.name.endsWith('.zip') || file.type === 'application/zip';
  const totalBytes = file.size;

  if (isGz && typeof DecompressionStream !== 'undefined') {
    // Stream decompress directly chunk by chunk without buffering all in RAM
    const ds = new DecompressionStream('gzip');
    const decompressedStream = file.stream().pipeThrough(ds);
    const reader = decompressedStream.getReader();
    await processStreamReader(reader, totalBytes);
  } else if (isGz) {
    // Fallback fflate decompression
    postProgress({
      phase: 'decompressing',
      progress: 20,
      decompressionProgress: 20,
      processedBytes: 0,
      totalBytes,
      processedEntries: 0,
      processingSpeedMBps: 0,
      estimatedRemainingSeconds: 0,
    });
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const decompressed = fflate.gunzipSync(uint8);
    const text = fflate.strFromU8(decompressed);
    await processTextStream(text, totalBytes);
  } else if (isZip) {
    postProgress({
      phase: 'decompressing',
      progress: 20,
      decompressionProgress: 20,
      processedBytes: 0,
      totalBytes,
      processedEntries: 0,
      processingSpeedMBps: 0,
      estimatedRemainingSeconds: 0,
    });
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const unzipped = fflate.unzipSync(uint8);
    const logKey = Object.keys(unzipped).find((k) => k.endsWith('.log') || k.endsWith('.txt')) || Object.keys(unzipped)[0];
    if (!logKey) throw new Error('No log file found inside zip archive');
    const text = fflate.strFromU8(unzipped[logKey]);
    await processTextStream(text, totalBytes);
  } else {
    // Plain uncompressed stream
    const reader = file.stream().getReader();
    await processStreamReader(reader, totalBytes);
  }
}

async function processStreamReader(reader: ReadableStreamDefaultReader<Uint8Array>, totalCompressedBytes: number) {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let remainder = '';
  let lineNumber = 0;
  let totalDecompressedBytes = 0;
  const startTime = Date.now();
  let lastProgressTime = startTime;

  // Running Aggregates State
  let slowQueriesCount = 0;
  let errorsCount = 0;
  let warningsCount = 0;
  let infoCount = 0;
  let totalOperations = 0;

  let minDate = Infinity;
  let maxDate = -Infinity;
  let minDateStr = '';
  let maxDateStr = '';

  let durationSum = 0;
  let durationCount = 0;
  let maxDuration = 0;
  let minDuration = Infinity;

  // Reservoir for accurate percentile calculation without RAM bloat
  const durationReservoir: number[] = [];

  // Bounded collections and operations
  const namespaceMap = new Map<string, {
    database: string;
    collection: string;
    queriesCount: number;
    durationSum: number;
    maxDuration: number;
    slowCount: number;
    errorCount: number;
    collscanCount: number;
    ops: Record<string, number>;
    durationSamples: number[];
  }>();

  const opMap = new Map<string, { count: number; durationSum: number; maxDuration: number; slowCount: number; durationSamples: number[] }>();

  // Error Clusters Map
  const errorMap = new Map<string, {
    message: string;
    component: string;
    severity: LogEntry['severity'];
    errorCode?: number;
    firstSeen: string;
    lastSeen: string;
    instances: LogEntry[];
    count: number;
  }>();

  // Bounded Slow Queries Pool (Sorted by duration)
  const slowQueriesPool: LogEntry[] = [];

  // Sampled Raw Entries for UI Console
  const rawLogsSample: LogEntry[] = [];

  // Timeline buckets (60 time intervals)
  const timelineBucketsMap = new Map<number, {
    total: number;
    slowCount: number;
    errorCount: number;
    durations: number[];
  }>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalDecompressedBytes += value.length;
    const chunkText = decoder.decode(value, { stream: true });
    const fullText = remainder + chunkText;
    const lines = fullText.split('\n');
    remainder = lines.pop() || ''; // Last element is the incomplete remainder

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;
      lineNumber++;

      // Fast parsing & metric extraction
      const isJson = line.charCodeAt(0) === 123 || line.trimStart().charCodeAt(0) === 123; // '{'
      let entry: LogEntry | null = null;

      if (isJson) {
        entry = parseJsonLogLine(line, lineNumber);
      } else {
        entry = parseLegacyLogLine(line, lineNumber);
      }

      if (!entry) continue;

      // Update time range
      if (entry.parsedDate) {
        if (entry.parsedDate < minDate) {
          minDate = entry.parsedDate;
          minDateStr = entry.timestamp;
        }
        if (entry.parsedDate > maxDate) {
          maxDate = entry.parsedDate;
          maxDateStr = entry.timestamp;
        }
      }

      // Update basic counters
      if (entry.isSlowQuery) slowQueriesCount++;
      if (entry.isError) errorsCount++;
      if (entry.isWarning) warningsCount++;
      if (entry.severity === 'I') infoCount++;

      // Duration metrics
      if (entry.durationMillis !== undefined && entry.durationMillis !== null) {
        const d = entry.durationMillis;
        durationSum += d;
        durationCount++;
        if (d > maxDuration) maxDuration = d;
        if (d < minDuration) minDuration = d;

        // Reservoir sampling for global percentiles
        if (durationReservoir.length < DURATION_RESERVOIR_SIZE) {
          durationReservoir.push(d);
        } else {
          const rIdx = Math.floor(Math.random() * durationCount);
          if (rIdx < DURATION_RESERVOIR_SIZE) {
            durationReservoir[rIdx] = d;
          }
        }
      }

      // Update Namespace metrics
      if (entry.namespace) {
        let nsStat = namespaceMap.get(entry.namespace);
        if (!nsStat) {
          const { database, collection } = extractNamespaceDetails(entry.namespace);
          nsStat = {
            database: database || 'default',
            collection: collection || entry.namespace,
            queriesCount: 0,
            durationSum: 0,
            maxDuration: 0,
            slowCount: 0,
            errorCount: 0,
            collscanCount: 0,
            ops: {},
            durationSamples: [],
          };
          namespaceMap.set(entry.namespace, nsStat);
        }

        nsStat.queriesCount++;
        if (entry.durationMillis !== undefined) {
          nsStat.durationSum += entry.durationMillis;
          if (entry.durationMillis > nsStat.maxDuration) nsStat.maxDuration = entry.durationMillis;
          if (nsStat.durationSamples.length < 500) {
            nsStat.durationSamples.push(entry.durationMillis);
          }
        }
        if (entry.isSlowQuery) nsStat.slowCount++;
        if (entry.isError) nsStat.errorCount++;
        if (entry.planSummary?.includes('COLLSCAN')) nsStat.collscanCount++;
        if (entry.operation) {
          nsStat.ops[entry.operation] = (nsStat.ops[entry.operation] || 0) + 1;
        }
      }

      // Update Operation metrics
      if (entry.operation) {
        totalOperations++;
        let opStat = opMap.get(entry.operation);
        if (!opStat) {
          opStat = { count: 0, durationSum: 0, maxDuration: 0, slowCount: 0, durationSamples: [] };
          opMap.set(entry.operation, opStat);
        }
        opStat.count++;
        if (entry.durationMillis !== undefined) {
          opStat.durationSum += entry.durationMillis;
          if (entry.durationMillis > opStat.maxDuration) opStat.maxDuration = entry.durationMillis;
          if (opStat.durationSamples.length < 500) {
            opStat.durationSamples.push(entry.durationMillis);
          }
        }
        if (entry.isSlowQuery) opStat.slowCount++;
      }

      // Update Error Clusters
      if (entry.isError) {
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
            count: 0,
          };
          errorMap.set(errKey, errGroup);
        }
        errGroup.count++;
        errGroup.lastSeen = entry.timestamp;
        if (errGroup.instances.length < 15) {
          errGroup.instances.push(entry);
        }
      }

      // Manage Slow Queries Pool
      if (entry.isSlowQuery) {
        if (slowQueriesPool.length < MAX_SLOW_QUERIES_IN_MEMORY) {
          slowQueriesPool.push(entry);
        } else {
          // If slower than the fastest in pool, replace
          const minSlowIdx = findMinDurationIndex(slowQueriesPool);
          if ((entry.durationMillis || 0) > (slowQueriesPool[minSlowIdx].durationMillis || 0)) {
            slowQueriesPool[minSlowIdx] = entry;
          }
        }
      }

      // Sample raw logs for virtual console
      if (rawLogsSample.length < MAX_RAW_LOGS_IN_MEMORY) {
        rawLogsSample.push(entry);
      } else if (entry.isSlowQuery || entry.isError) {
        // Keep high-value slow queries and errors in the raw logs view
        const replaceIdx = Math.floor(Math.random() * rawLogsSample.length);
        if (!rawLogsSample[replaceIdx].isSlowQuery && !rawLogsSample[replaceIdx].isError) {
          rawLogsSample[replaceIdx] = entry;
        }
      }

      // Aggregate into 1-minute timeline buckets
      if (entry.parsedDate) {
        const bucketKey = Math.floor(entry.parsedDate / 60000) * 60000;
        let b = timelineBucketsMap.get(bucketKey);
        if (!b) {
          b = { total: 0, slowCount: 0, errorCount: 0, durations: [] };
          timelineBucketsMap.set(bucketKey, b);
        }
        b.total++;
        if (entry.isSlowQuery) b.slowCount++;
        if (entry.isError) b.errorCount++;
        if (entry.durationMillis !== undefined && b.durations.length < 200) {
          b.durations.push(entry.durationMillis);
        }
      }
    }

    // Emit progress throttle (every 100ms)
    const now = Date.now();
    if (now - lastProgressTime > 120) {
      lastProgressTime = now;
      const elapsedMs = Math.max(1, now - startTime);
      const speedMBps = Number(((totalDecompressedBytes / (1024 * 1024)) / (elapsedMs / 1000)).toFixed(1));
      const approxProgress = Math.min(99, Math.round((totalDecompressedBytes / (totalCompressedBytes * 8)) * 100));

      postProgress({
        phase: 'parsing',
        progress: approxProgress,
        processedBytes: totalDecompressedBytes,
        totalBytes: totalCompressedBytes,
        processedEntries: lineNumber,
        processingSpeedMBps: speedMBps,
        estimatedRemainingSeconds: Math.max(1, Math.round((totalCompressedBytes * 8 - totalDecompressedBytes) / (speedMBps * 1024 * 1024))),
      });
    }
  }

  // Handle trailing remainder line
  if (remainder.trim()) {
    lineNumber++;
  }

  postProgress({
    phase: 'analyzing',
    progress: 99,
    processedBytes: totalDecompressedBytes,
    totalBytes: totalCompressedBytes,
    processedEntries: lineNumber,
    processingSpeedMBps: 0,
    estimatedRemainingSeconds: 0,
  });

  // Calculate percentiles and build final result
  durationReservoir.sort((a, b) => a - b);
  const avgDuration = durationCount > 0 ? Math.round(durationSum / durationCount) : 0;
  const p50Duration = getPercentile(durationReservoir, 50);
  const p95Duration = getPercentile(durationReservoir, 95);
  const p99Duration = getPercentile(durationReservoir, 99);

  // Build Collections Stats
  const collections: CollectionStat[] = [];
  for (const [ns, stat] of namespaceMap.entries()) {
    stat.durationSamples.sort((a, b) => a - b);
    const avg = stat.queriesCount > 0 ? Math.round(stat.durationSum / stat.queriesCount) : 0;
    const p95 = getPercentile(stat.durationSamples, 95);

    collections.push({
      namespace: ns,
      database: stat.database,
      collection: stat.collection,
      queriesCount: stat.queriesCount,
      avgDuration: avg,
      p95Duration: p95 || avg,
      maxDuration: stat.maxDuration,
      slowQueriesCount: stat.slowCount,
      errorsCount: stat.errorCount,
      collscanCount: stat.collscanCount,
      operations: stat.ops,
    });
  }
  collections.sort((a, b) => b.queriesCount - a.queriesCount);

  // Build Operations Stats
  const operations: OperationStat[] = [];
  for (const [op, stat] of opMap.entries()) {
    stat.durationSamples.sort((a, b) => a - b);
    const avg = stat.count > 0 ? Math.round(stat.durationSum / stat.count) : 0;
    const p95 = getPercentile(stat.durationSamples, 95);

    operations.push({
      operation: op,
      count: stat.count,
      percentage: Number(((stat.count / Math.max(1, totalOperations)) * 100).toFixed(1)),
      avgDuration: avg,
      p95Duration: p95 || avg,
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
      count: group.count,
      firstSeen: group.firstSeen,
      lastSeen: group.lastSeen,
      errorCode: group.errorCode,
      instances: group.instances,
    });
  }
  errorGroups.sort((a, b) => b.count - a.count);

  // Build Timeline (Downsample buckets to 50 items)
  const timeline: TimelineBucket[] = [];
  const sortedBucketKeys = Array.from(timelineBucketsMap.keys()).sort((a, b) => a - b);
  const step = Math.max(1, Math.floor(sortedBucketKeys.length / 50));

  for (let k = 0; k < sortedBucketKeys.length; k += step) {
    const key = sortedBucketKeys[k];
    const b = timelineBucketsMap.get(key)!;
    b.durations.sort((a, b) => a - b);
    const avg = b.durations.length > 0 ? Math.round(b.durations.reduce((x, y) => x + y, 0) / b.durations.length) : 0;
    const p95 = getPercentile(b.durations, 95);
    const p99 = getPercentile(b.durations, 99);

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

  // Sort slow queries pool descending by duration
  slowQueriesPool.sort((a, b) => (b.durationMillis || 0) - (a.durationMillis || 0));

  const summary: LogSummary = {
    totalEntries: lineNumber,
    slowQueriesCount,
    errorsCount,
    warningsCount,
    infoCount,
    avgDuration,
    p50Duration,
    p95Duration,
    p99Duration,
    maxDuration: maxDuration === -Infinity ? 0 : maxDuration,
    minDuration: minDuration === Infinity ? 0 : minDuration,
    timeRange: minDateStr && maxDateStr ? {
      start: minDateStr,
      end: maxDateStr,
      startMs: minDate,
      endMs: maxDate,
    } : null,
    totalOperations,
    uniqueCollectionsCount: collections.length,
    uniqueNamespaces: collections.map((c) => c.namespace),
    uniqueOperations: operations.map((o) => o.operation),
  };

  const finalResult: WorkerParseResult = {
    entries: rawLogsSample,
    summary,
    timeline,
    collections,
    operations,
    errorGroups,
    slowQueries: slowQueriesPool,
  };

  postProgress({
    phase: 'complete',
    progress: 100,
    processedBytes: totalDecompressedBytes,
    totalBytes: totalCompressedBytes,
    processedEntries: lineNumber,
    processingSpeedMBps: 0,
    estimatedRemainingSeconds: 0,
  });

  postResult(finalResult);
}

async function processTextStream(text: string, totalBytes: number) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });
  await processStreamReader(stream.getReader(), totalBytes);
}

function findMinDurationIndex(queries: LogEntry[]): number {
  let minIdx = 0;
  let minDur = queries[0]?.durationMillis || 0;
  for (let i = 1; i < queries.length; i++) {
    const d = queries[i]?.durationMillis || 0;
    if (d < minDur) {
      minDur = d;
      minIdx = i;
    }
  }
  return minIdx;
}

function getPercentile(sortedList: number[], pct: number): number {
  if (sortedList.length === 0) return 0;
  const idx = Math.ceil((pct / 100) * sortedList.length) - 1;
  return sortedList[Math.max(0, Math.min(idx, sortedList.length - 1))];
}
