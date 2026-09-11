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
          type: 'warning',
          title: 'Foreign Collection Join ($lookup)',
          description: 'The pipeline performs a foreign collection join ($lookup). Unindexed foreign field lookups run sequentially on the target collection.',
          recommendation: 'Ensure an index exists on the foreign collection matching the "foreignField" in the $lookup stage.',
          antiPattern: {
            code: 'UNINDEXED_LOOKUP',
            title: 'Unindexed Foreign $lookup Stage',
            description: 'Unindexed $lookup forces nested collection scans on the foreign collection for every input document.',
            severity: 'warning',
          },
        });
      }
    }
  }

  // 6. Anti-Pattern: Leading Regex Wildcard
  if (entry.command) {
    const filter = entry.command.filter || entry.command.query || (entry.command.pipeline && entry.command.pipeline[0] ? entry.command.pipeline[0].$match : null);
    if (filter && typeof filter === 'object') {
      const checkRegexWildcard = (obj: any): boolean => {
        for (const [k, v] of Object.entries(obj)) {
          if (k === '$regex' && typeof v === 'string') {
            if (v.startsWith('.*') || v.startsWith('%') || !v.startsWith('^')) return true;
          } else if (typeof v === 'string' && (v.startsWith('/.*') || (v.startsWith('/') && !v.startsWith('/^')))) {
            return true;
          } else if (typeof v === 'object' && v !== null && checkRegexWildcard(v)) {
            return true;
          }
        }
        return false;
      };

      if (checkRegexWildcard(filter)) {
        insights.push({
          type: 'danger',
          title: 'Anti-Pattern: Leading Wildcard in Regex',
          description: 'Regex filter contains a leading wildcard (e.g. ".*abc" or unanchored string). MongoDB cannot use index b-tree prefixes for unanchored regexes.',
          recommendation: 'Anchor the regex with "^" (e.g., /^prefix/) or implement MongoDB Atlas Search / text index for full-text search.',
          antiPattern: {
            code: 'REGEX_WILDCARD',
            title: 'Unanchored Regex Filter',
            description: 'Leading wildcards force full index or collection scans because the start of the string is unknown.',
            severity: 'critical',
          },
        });
      }

      // Anti-Pattern: Unbounded $in array
      const checkUnboundedIn = (obj: any): number => {
        for (const [k, v] of Object.entries(obj)) {
          if (k === '$in' && Array.isArray(v)) {
            if (v.length > 30) return v.length;
          } else if (typeof v === 'object' && v !== null) {
            const nested = checkUnboundedIn(v);
            if (nested > 0) return nested;
          }
        }
        return 0;
      };

      const inCount = checkUnboundedIn(filter);
      if (inCount > 30) {
        insights.push({
          type: 'warning',
          title: `Anti-Pattern: Large $in Predicate Array (${inCount} items)`,
          description: `Query passes ${inCount} values into an $in array. Large $in clauses force MongoDB to maintain large cursor branches and consume excessive RAM.`,
          recommendation: 'Break large $in lists into smaller batched queries or use a join collection with an indexed lookup.',
          antiPattern: {
            code: 'UNBOUNDED_IN',
            title: 'Unbounded $in Array',
            description: 'Massive $in clauses significantly degrade B-tree index lookup efficiency.',
            severity: 'warning',
          },
        });
      }

      // Anti-Pattern: Missing projection on find
      if (entry.operation === 'find' && (entry.nReturned || 0) > 10 && !entry.command.projection && !entry.command.fields) {
        insights.push({
          type: 'info',
          title: 'Missing Projection Clause',
          description: 'The query returns entire documents without a projection filter. This increases wire serialization and memory overhead.',
          recommendation: 'Specify a projection object (e.g. { field1: 1, field2: 1 }) to return only required attributes.',
          antiPattern: {
            code: 'MISSING_PROJECTION',
            title: 'Unprojected Document Retrieval',
            description: 'Fetching entire documents wastes network bandwidth and memory when only specific fields are needed.',
            severity: 'info',
          },
        });
      }
    }
  }

  // 7. High Duration Severity Alert
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

  // 8. Error or Exception Insight
  if (entry.isError) {
    insights.push({
      type: 'danger',
      title: entry.errorCode ? `MongoDB Error Code ${entry.errorCode}` : 'Database Error / Exception',
      description: entry.error || entry.message || 'Operation failed with an error',
      recommendation: 'Check error details and stack trace. Review server logs and client retry policies.',
    });
  }

  // Attach mongosh explain script to the first critical/warning insight
  const explainScript = generateExplainScript(entry);
  if (insights.length > 0 && explainScript) {
    insights[0].explainScript = explainScript;
  }

  // If no negative insights found and duration is fast
  if (insights.length === 0) {
    if (plan.includes('IXSCAN')) {
      insights.push({
        type: 'success',
        title: 'Optimal Index Scan (IXSCAN)',
        description: 'The query successfully utilized an existing index for filtering.',
        explainScript: explainScript || undefined,
      });
    } else {
      insights.push({
        type: 'info',
        title: 'Standard Log Record',
        description: 'No major performance anomalies detected for this specific entry.',
        explainScript: explainScript || undefined,
      });
    }
  }

  return insights;
}

export function generateExplainScript(entry: LogEntry): string | null {
  if (!entry.collection && !entry.namespace) return null;
  const coll = entry.collection || (entry.namespace ? entry.namespace.split('.')[1] : 'collection');
  const cmd = entry.command;

  if (entry.operation === 'find' || cmd?.find) {
    const filter = cmd?.filter || cmd?.query || {};
    const sort = cmd?.sort;
    let script = `db.${coll}.find(${JSON.stringify(filter)})`;
    if (sort) script += `.sort(${JSON.stringify(sort)})`;
    script += `.explain("executionStats")`;
    return script;
  }

  if (entry.operation === 'aggregate' || cmd?.aggregate) {
    const pipeline = cmd?.pipeline || [];
    return `db.${coll}.aggregate(${JSON.stringify(pipeline, null, 2)}, { explain: "executionStats" })`;
  }

  if (entry.operation === 'update' || cmd?.update) {
    const updates = cmd && cmd.updates ? cmd.updates[0] : undefined;
    const q = updates?.q || {};
    const u = updates?.u || {};
    return `db.${coll}.explain("executionStats").update(${JSON.stringify(q)}, ${JSON.stringify(u)})`;
  }

  return `db.${coll}.find({}).explain("executionStats")`;
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
    return `db.${coll}.createIndex(${keysStr}, { background: true })`;
  }

  return `db.${coll}.createIndex({ <field>: 1 }, { background: true })`;
}

