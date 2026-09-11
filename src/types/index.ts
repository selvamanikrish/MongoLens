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

export interface AntiPatternFinding {
  code: 'REGEX_WILDCARD' | 'UNBOUNDED_IN' | 'SORT_BUFFER_RISK' | 'MISSING_PROJECTION' | 'UNINDEXED_LOOKUP';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface PerformanceInsight {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  recommendation?: string;
  suggestedIndex?: string;
  antiPattern?: AntiPatternFinding;
  explainScript?: string;
}

export type ActivePage = 
  | 'overview'
  | 'slow-queries'
  | 'operations'
  | 'collections'
  | 'connections'
  | 'errors'
  | 'timeline'
  | 'compare'
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

export interface ConnectionTimelinePoint {
  time: string;
  timestamp: number;
  activeConnections: number;
  connectionsAccepted: number;
  connectionsClosed: number;
}

export interface AppConnectionStat {
  appName: string;
  count: number;
  percentage: number;
  slowQueriesCount: number;
}

export interface RemoteHostStat {
  remoteHost: string;
  count: number;
  percentage: number;
}

export interface SocketErrorStat {
  message: string;
  count: number;
  lastSeen: string;
  remote?: string;
}

export interface ConnectionDiagnostics {
  totalAccepted: number;
  totalClosed: number;
  maxConcurrent: number;
  currentEstimated: number;
  timeline: ConnectionTimelinePoint[];
  topApps: AppConnectionStat[];
  topRemotes: RemoteHostStat[];
  socketErrors: SocketErrorStat[];
}

export interface MetricDelta {
  baseline: number;
  candidate: number;
  delta: number;
  percentChange: number;
  improved: boolean;
}

export interface QueryComparisonItem {
  shape: string;
  namespace: string;
  operation: string;
  status: 'resolved' | 'regressed' | 'new' | 'improved' | 'unchanged';
  baselineAvgMs?: number;
  candidateAvgMs?: number;
  baselineCount?: number;
  candidateCount?: number;
  deltaMs?: number;
  percentChange?: number;
  sampleEntry: LogEntry;
}

export interface ComparisonResult {
  baselineName: string;
  candidateName: string;
  metrics: {
    p50: MetricDelta;
    p95: MetricDelta;
    p99: MetricDelta;
    avgDuration: MetricDelta;
    slowQueriesCount: MetricDelta;
    errorsCount: MetricDelta;
    collscanCount: MetricDelta;
  };
  queryDiffs: QueryComparisonItem[];
}

export interface WorkerParseResult {
  entries: LogEntry[];
  summary: LogSummary;
  timeline: TimelineBucket[];
  collections: CollectionStat[];
  operations: OperationStat[];
  errorGroups: ErrorGroup[];
  slowQueries: LogEntry[];
  connections?: ConnectionDiagnostics;
}
