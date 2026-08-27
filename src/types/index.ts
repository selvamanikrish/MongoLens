export type LogSeverity = 'F' | 'E' | 'W' | 'I' | 'D' | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'UNKNOWN';

export interface LogEntry {
  id: string;
  lineNumber: number;
  timestamp: string;
  parsedDate: number; // epoch ms
  severity: LogSeverity;
  component: string;
  context: string;
  message: string;
  raw: string;
  namespace?: string;
  database?: string;
  collection?: string;
  operation?: string;
  durationMillis?: number;
  planSummary?: string;
  keysExamined?: number;
  docsExamined?: number;
  nReturned?: number;
  keysInserted?: number;
  keysDeleted?: number;
  numYields?: number;
  remote?: string;
  connectionId?: number;
  command?: Record<string, any>;
  commandStr?: string;
  error?: string;
  errorCode?: number;
  appName?: string;
  isSlowQuery: boolean;
  isError: boolean;
  isWarning: boolean;
}

export interface LogSummary {
  totalEntries: number;
  slowQueriesCount: number;
  errorsCount: number;
  warningsCount: number;
  infoCount: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  maxDuration: number;
  minDuration: number;
  timeRange: {
    start: string;
    end: string;
    startMs: number;
    endMs: number;
  } | null;
  totalOperations: number;
  uniqueCollectionsCount: number;
  uniqueNamespaces: string[];
  uniqueOperations: string[];
}

export interface TimelineBucket {
  time: string;
  timestamp: number;
  total: number;
  slowCount: number;
  errorCount: number;
  avgDuration: number;
  p95Duration: number;
  p99Duration: number;
}

export interface CollectionStat {
  namespace: string;
  database: string;
  collection: string;
  queriesCount: number;
  avgDuration: number;
  p95Duration: number;
  maxDuration: number;
  slowQueriesCount: number;
  errorsCount: number;
  collscanCount: number;
  operations: Record<string, number>;
}

export interface OperationStat {
  operation: string;
  count: number;
  percentage: number;
  avgDuration: number;
  p95Duration: number;
  slowCount: number;
}

export interface ErrorGroup {
  id: string;
  message: string;
  component: string;
  severity: LogSeverity;
  count: number;
  firstSeen: string;
  lastSeen: string;
  errorCode?: number;
  instances: LogEntry[];
}

export interface PerformanceInsight {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  recommendation?: string;
  suggestedIndex?: string;
}

export type ActivePage = 
  | 'overview'
  | 'slow-queries'
  | 'operations'
  | 'collections'
  | 'errors'
  | 'timeline'
  | 'raw-logs';

export interface FilterState {
  searchQuery: string;
  minDurationMs: number;
  maxDurationMs?: number;
  selectedNamespace: string; // 'ALL' or specific namespace
  selectedOperation: string; // 'ALL' or specific operation
  selectedSeverity: string; // 'ALL' or specific severity
  selectedPlan: string; // 'ALL', 'COLLSCAN', 'IXSCAN', etc.
  timeRangeFilter: {
    startMs: number | null;
    endMs: number | null;
  };
  onlySlowQueries: boolean;
  onlyErrors: boolean;
}

export interface ParseProgressPayload {
  phase: 'idle' | 'decompressing' | 'parsing' | 'analyzing' | 'complete' | 'error';
  progress: number; // 0 to 100
  decompressionProgress?: number;
  processedBytes: number;
  totalBytes: number;
  processedEntries: number;
  processingSpeedMBps: number;
  estimatedRemainingSeconds: number;
  errorMessage?: string;
}

export interface WorkerParseResult {
  entries: LogEntry[];
  summary: LogSummary;
  timeline: TimelineBucket[];
  collections: CollectionStat[];
  operations: OperationStat[];
  errorGroups: ErrorGroup[];
  slowQueries: LogEntry[];
}
