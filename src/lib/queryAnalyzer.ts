import type { LogEntry, PerformanceInsight } from '../types';

export function analyzeQueryPerformance(entry: LogEntry): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const plan = (entry.planSummary || '').toUpperCase();
  const docsExamined = entry.docsExamined || 0;
  const keysExamined = entry.keysExamined || 0;
  const nReturned = entry.nReturned || 0;
  const duration = entry.durationMillis || 0;

  // 1. COLLSCAN Detection
  if (plan.includes('COLLSCAN')) {
    const rec = 'The query appears to perform a full collection scan without using an index. Consider creating an index on the filter attributes.';
    const suggestedIndex = generateIndexSuggestion(entry);

    insights.push({
      type: 'danger',
      title: 'Collection Scan Detected (COLLSCAN)',
      description: `MongoDB examined ${docsExamined > 0 ? docsExamined.toLocaleString() : 'all'} documents sequentially in collection "${entry.collection || entry.namespace || 'target'}" because no suitable index was matched.`,
      recommendation: rec,
      suggestedIndex: suggestedIndex || undefined,
    });
  }

  // 2. High docsExamined to nReturned ratio (even with index or scan)
  if (docsExamined > 0 && nReturned > 0 && docsExamined / nReturned > 50 && !plan.includes('COLLSCAN')) {
    insights.push({
      type: 'warning',
      title: 'Inefficient Document Filtering Ratio',
      description: `MongoDB examined ${docsExamined.toLocaleString()} documents to return only ${nReturned.toLocaleString()} records (Ratio: ${(docsExamined / nReturned).toFixed(1)}:1).`,
      recommendation: 'A more selective compound index covering additional filter predicates could reduce document fetching overhead.',
    });
  }

  // 3. High keysExamined to nReturned ratio
  if (keysExamined > 0 && nReturned > 0 && keysExamined / nReturned > 100) {
    insights.push({
      type: 'warning',
      title: 'High Index Key Scan Overhead',
      description: `Scanned ${keysExamined.toLocaleString()} index keys to return only ${nReturned.toLocaleString()} documents (Ratio: ${(keysExamined / nReturned).toFixed(1)}:1).`,
      recommendation: 'Verify the order of index keys following the Equality-Sort-Range (ESR) guideline.',
    });
  }

  // 4. In-Memory SORT detection
  if (plan.includes('SORT') && !plan.includes('IXSCAN')) {
    insights.push({
      type: 'danger',
      title: 'Unindexed In-Memory Sort Detected',
      description: 'The query performs an in-memory sort stage. Unindexed sorts consume server RAM and fail if memory consumption exceeds MongoDB’s 100MB threshold.',
      recommendation: 'Include the sort fields in a compound index immediately following the equality filter fields.',
    });
  } else if (plan.includes('SORT') && plan.includes('IXSCAN')) {
    insights.push({
      type: 'warning',
      title: 'Index Scan with Secondary In-Memory Sort',
      description: 'The index was used to filter records, but a secondary in-memory sort was executed for the ordering stage.',
      recommendation: 'Consider extending the index to include the sort key to enable indexed sort without memory buffering.',
    });
  }

  // 5. Aggregation Pipeline Analysis
  if (entry.operation === 'aggregate' && entry.command) {
    const pipeline = entry.command.pipeline || (entry.command.aggregate && Array.isArray(entry.command.pipeline) ? entry.command.pipeline : []);
    if (Array.isArray(pipeline)) {
      if (pipeline.length > 5) {
        insights.push({
          type: 'info',
          title: 'Complex Multi-Stage Aggregation Pipeline',
          description: `Pipeline contains ${pipeline.length} stages. High stage counts can increase CPU and memory utilization.`,
          recommendation: 'Review pipeline stages to ensure heavy transformation stages ($unwind, $group, $facet) execute after initial $match filtering.',
        });
      }

      // Check if first stage is $match
      const firstStage = pipeline[0] ? Object.keys(pipeline[0])[0] : '';
      if (firstStage && firstStage !== '$match') {
        insights.push({
          type: 'warning',
          title: 'Missing Early $match Stage',
          description: `The first pipeline stage is "${firstStage}" rather than a selective "$match" filter.`,
          recommendation: 'Placing a selective $match stage at the very beginning of the pipeline allows MongoDB to use indexes and minimize documents processed in subsequent stages.',
        });
      }

      // Check for $lookup
      const hasLookup = pipeline.some((st: any) => st.$lookup);
      if (hasLookup) {
        insights.push({
          type: 'info',
          title: 'Foreign Collection Join ($lookup)',
          description: 'The pipeline performs a foreign collection join ($lookup). Unindexed foreign field lookups run sequentially on the target collection.',
          recommendation: 'Ensure an index exists on the foreign collection matching the "foreignField" in the $lookup stage.',
        });
      }
    }
  }

  // 6. High Duration Severity Alert
  if (duration >= 5000) {
    insights.push({
      type: 'danger',
      title: `Critical Query Latency (${(duration / 1000).toFixed(2)}s)`,
      description: `Query took ${(duration / 1000).toFixed(2)} seconds to execute, which can saturate connection pools and cause client timeouts.`,
      recommendation: 'Investigate whether this operation can be optimized, offloaded to a secondary read replica, or run asynchronously.',
    });
  } else if (duration >= 1000) {
    insights.push({
      type: 'warning',
      title: `Elevated Query Latency (${duration}ms)`,
      description: `Execution duration exceeds the 1000ms threshold.`,
      recommendation: 'Review execution stats (keysExamined vs docsExamined) and index usage.',
    });
  }

  // 7. Error or Exception Insight
  if (entry.isError) {
    insights.push({
      type: 'danger',
      title: entry.errorCode ? `MongoDB Error Code ${entry.errorCode}` : 'Database Error / Exception',
      description: entry.error || entry.message || 'Operation failed with an error',
      recommendation: 'Check error details and stack trace. Review server logs and client retry policies.',
    });
  }

  // If no negative insights found and duration is fast
  if (insights.length === 0) {
    if (plan.includes('IXSCAN')) {
      insights.push({
        type: 'success',
        title: 'Optimal Index Scan (IXSCAN)',
        description: 'The query successfully utilized an existing index for filtering.',
      });
    } else {
      insights.push({
        type: 'info',
        title: 'Standard Log Record',
        description: 'No major performance anomalies detected for this specific entry.',
      });
    }
  }

  return insights;
}

function generateIndexSuggestion(entry: LogEntry): string | null {
  if (!entry.command || !entry.collection) return null;
  const coll = entry.collection;

  let filterObj: Record<string, any> | null = null;
  let sortObj: Record<string, any> | null = null;

  // Extract from command
  if (entry.command.filter && typeof entry.command.filter === 'object') {
    filterObj = entry.command.filter;
  } else if (entry.command.query && typeof entry.command.query === 'object') {
    filterObj = entry.command.query;
  } else if (entry.command.pipeline && Array.isArray(entry.command.pipeline)) {
    const matchStage = entry.command.pipeline.find((s: any) => s.$match);
    if (matchStage && matchStage.$match) {
      filterObj = matchStage.$match;
    }
    const sortStage = entry.command.pipeline.find((s: any) => s.$sort);
    if (sortStage && sortStage.$sort) {
      sortObj = sortStage.$sort;
    }
  }

  if (entry.command.sort && typeof entry.command.sort === 'object') {
    sortObj = entry.command.sort;
  }

  const indexKeys: Record<string, number> = {};

  if (filterObj) {
    for (const key of Object.keys(filterObj)) {
      if (!key.startsWith('$')) {
        indexKeys[key] = 1;
      }
    }
  }

  if (sortObj) {
    for (const [key, dir] of Object.entries(sortObj)) {
      if (!key.startsWith('$') && !indexKeys[key]) {
        indexKeys[key] = typeof dir === 'number' ? dir : 1;
      }
    }
  }

  if (Object.keys(indexKeys).length > 0) {
    const keysStr = JSON.stringify(indexKeys).replace(/"/g, '');
    return `db.${coll}.createIndex(${keysStr})`;
  }

  return `db.${coll}.createIndex({ <field>: 1 })`;
}
