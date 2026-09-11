import type { ComparisonResult, MetricDelta, QueryComparisonItem, WorkerParseResult } from '../types';

function calculateDelta(baseline: number, candidate: number, lowerIsBetter = true): MetricDelta {
  const delta = candidate - baseline;
  let percentChange = 0;
  if (baseline !== 0) {
    percentChange = Number(((delta / baseline) * 100).toFixed(1));
  } else if (candidate !== 0) {
    percentChange = 100;
  }

  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  return {
    baseline,
    candidate,
    delta,
    percentChange,
    improved,
  };
}

function getQueryShapeKey(entry: any): string {
  const op = entry.operation || 'QUERY';
  const ns = entry.namespace || 'unknown';
  let keys = '';
  if (entry.command) {
    const filter = entry.command.filter || entry.command.query || (entry.command.pipeline && entry.command.pipeline[0] ? entry.command.pipeline[0].$match : null);
    if (filter && typeof filter === 'object') {
      keys = Object.keys(filter).sort().join(',');
    }
  }
  return `${op}:${ns}:{${keys}}`;
}

export function compareLogResults(
  baseline: WorkerParseResult,
  baselineName: string,
  candidate: WorkerParseResult,
  candidateName: string
): ComparisonResult {
  const baselineCollscan = baseline.collections.reduce((sum, c) => sum + c.collscanCount, 0);
  const candidateCollscan = candidate.collections.reduce((sum, c) => sum + c.collscanCount, 0);

  const metrics = {
    p50: calculateDelta(baseline.summary.p50Duration, candidate.summary.p50Duration),
    p95: calculateDelta(baseline.summary.p95Duration, candidate.summary.p95Duration),
    p99: calculateDelta(baseline.summary.p99Duration, candidate.summary.p99Duration),
    avgDuration: calculateDelta(baseline.summary.avgDuration, candidate.summary.avgDuration),
    slowQueriesCount: calculateDelta(baseline.summary.slowQueriesCount, candidate.summary.slowQueriesCount),
    errorsCount: calculateDelta(baseline.summary.errorsCount, candidate.summary.errorsCount),
    collscanCount: calculateDelta(baselineCollscan, candidateCollscan),
  };

  // Group queries by shape
  const baselineMap = new Map<string, { totalMs: number; count: number; sample: any }>();
  for (const q of baseline.slowQueries) {
    const key = getQueryShapeKey(q);
    const existing = baselineMap.get(key) || { totalMs: 0, count: 0, sample: q };
    existing.totalMs += q.durationMillis || 0;
    existing.count++;
    baselineMap.set(key, existing);
  }

  const candidateMap = new Map<string, { totalMs: number; count: number; sample: any }>();
  for (const q of candidate.slowQueries) {
    const key = getQueryShapeKey(q);
    const existing = candidateMap.get(key) || { totalMs: 0, count: 0, sample: q };
    existing.totalMs += q.durationMillis || 0;
    existing.count++;
    candidateMap.set(key, existing);
  }

  const allKeys = new Set([...baselineMap.keys(), ...candidateMap.keys()]);
  const queryDiffs: QueryComparisonItem[] = [];

  for (const key of allKeys) {
    const base = baselineMap.get(key);
    const cand = candidateMap.get(key);

    const sample = (cand && cand.sample) ? cand.sample : (base && base.sample) ? base.sample : null;
    const ns = sample && sample.namespace ? sample.namespace : 'unknown';
    const op = sample && sample.operation ? sample.operation : 'QUERY';

    const baseAvg = base ? Math.round(base.totalMs / base.count) : undefined;
    const candAvg = cand ? Math.round(cand.totalMs / cand.count) : undefined;

    let status: QueryComparisonItem['status'] = 'unchanged';
    let deltaMs: number | undefined;
    let percentChange: number | undefined;

    if (base && !cand && baseAvg !== undefined) {
      status = 'resolved';
      deltaMs = -baseAvg;
      percentChange = -100;
    } else if (!base && cand && candAvg !== undefined) {
      status = 'new';
      deltaMs = candAvg;
      percentChange = 100;
    } else if (base && cand && baseAvg !== undefined && candAvg !== undefined) {
      deltaMs = candAvg - baseAvg;
      percentChange = Number(((deltaMs / Math.max(1, baseAvg)) * 100).toFixed(1));
      if (deltaMs > 50 && percentChange > 20) {
        status = 'regressed';
      } else if (deltaMs < -50 && percentChange < -20) {
        status = 'improved';
      } else {
        status = 'unchanged';
      }
    }

    queryDiffs.push({
      shape: key,
      namespace: ns,
      operation: op,
      status,
      baselineAvgMs: baseAvg,
      candidateAvgMs: candAvg,
      baselineCount: base ? base.count : undefined,
      candidateCount: cand ? cand.count : undefined,
      deltaMs,
      percentChange,
      sampleEntry: sample,
    });
  }

  // Sort query diffs: regressed & new first, then resolved, then improved
  const statusPriority: Record<QueryComparisonItem['status'], number> = {
    regressed: 1,
    new: 2,
    resolved: 3,
    improved: 4,
    unchanged: 5,
  };
  queryDiffs.sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  return {
    baselineName,
    candidateName,
    metrics,
    queryDiffs,
  };
}
