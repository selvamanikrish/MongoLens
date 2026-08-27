import { create } from 'zustand';
import type {
  ActivePage,
  FilterState,
  LogEntry,
  ParseProgressPayload,
  WorkerParseResult,
} from '../types';
import { generateRealisticDemoLog } from '../data/demoLogData';
import {
  trackPageView,
  trackFileUpload,
  trackDemoLoaded,
  trackSlowQueryInspected,
} from '../lib/analytics/gtag';

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

const initialFilters: FilterState = {
  searchQuery: '',
  minDurationMs: 0,
  maxDurationMs: undefined,
  selectedNamespace: 'ALL',
  selectedOperation: 'ALL',
  selectedSeverity: 'ALL',
  selectedPlan: 'ALL',
  timeRangeFilter: {
    startMs: null,
    endMs: null,
  },
  onlySlowQueries: false,
  onlyErrors: false,
};

interface LogStoreState {
  fileInfo: FileInfo | null;
  isParsing: boolean;
  parseProgress: ParseProgressPayload;
  logResult: WorkerParseResult | null;
  activePage: ActivePage;
  filters: FilterState;
  selectedQuery: LogEntry | null;
  isDrawerOpen: boolean;
  isCommandPaletteOpen: boolean;
  isShortcutsOpen: boolean;
  isExportOpen: boolean;
  isTermsOpen: boolean;
  isPrivacyOpen: boolean;
  isContactOpen: boolean;

  // Actions
  parseFile: (file: File) => void;
  loadDemoLog: () => void;
  setActivePage: (page: ActivePage) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  selectQuery: (query: LogEntry | null) => void;
  setDrawerOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setTermsOpen: (open: boolean) => void;
  setPrivacyOpen: (open: boolean) => void;
  setContactOpen: (open: boolean) => void;
  clearData: () => void;
}

let activeWorker: Worker | null = null;

export const useLogStore = create<LogStoreState>((set) => ({
  fileInfo: null,
  isParsing: false,
  parseProgress: {
    phase: 'idle',
    progress: 0,
    processedBytes: 0,
    totalBytes: 0,
    processedEntries: 0,
    processingSpeedMBps: 0,
    estimatedRemainingSeconds: 0,
  },
  logResult: null,
  activePage: 'overview',
  filters: initialFilters,
  selectedQuery: null,
  isDrawerOpen: false,
  isCommandPaletteOpen: false,
  isShortcutsOpen: false,
  isExportOpen: false,
  isTermsOpen: false,
  isPrivacyOpen: false,
  isContactOpen: false,

  parseFile: (file: File) => {
    if (activeWorker) {
      activeWorker.terminate();
    }

    const worker = new Worker(new URL('../worker/logWorker.ts', import.meta.url), {
      type: 'module',
    });
    activeWorker = worker;

    set({
      fileInfo: { name: file.name, size: file.size, type: file.type || 'text/plain' },
      isParsing: true,
      parseProgress: {
        phase: file.name.endsWith('.gz') || file.name.endsWith('.zip') ? 'decompressing' : 'parsing',
        progress: 0,
        processedBytes: 0,
        totalBytes: file.size,
        processedEntries: 0,
        processingSpeedMBps: 0,
        estimatedRemainingSeconds: 0,
      },
    });

    worker.onmessage = (e: MessageEvent) => {
      const { type, payload, result } = e.data;
      if (type === 'PROGRESS') {
        set({ parseProgress: payload });
        if (payload.phase === 'error') {
          set({ isParsing: false });
        }
      } else if (type === 'COMPLETE') {
        const res = result as WorkerParseResult;
        set({
          isParsing: false,
          logResult: res,
          activePage: 'overview',
        });
        trackFileUpload(file.name.endsWith('.gz') ? 'gz' : file.name.endsWith('.zip') ? 'zip' : 'log', file.size / (1024 * 1024), res.summary.totalEntries);
        trackPageView('overview');
      }
    };

    worker.onerror = (err) => {
      console.error('Worker error:', err);
      set({
        isParsing: false,
        parseProgress: {
          phase: 'error',
          progress: 0,
          processedBytes: 0,
          totalBytes: file.size,
          processedEntries: 0,
          processingSpeedMBps: 0,
          estimatedRemainingSeconds: 0,
          errorMessage: 'Web worker encountered an error while processing the log file.',
        },
      });
    };

    worker.postMessage({ type: 'PARSE_FILE', file });
  },

  loadDemoLog: () => {
    if (activeWorker) {
      activeWorker.terminate();
    }

    const demoText = generateRealisticDemoLog();
    const size = demoText.length;
    const worker = new Worker(new URL('../worker/logWorker.ts', import.meta.url), {
      type: 'module',
    });
    activeWorker = worker;

    set({
      fileInfo: { name: 'mongod-production-demo.log.gz', size, type: 'application/gzip' },
      isParsing: true,
      parseProgress: {
        phase: 'decompressing',
        progress: 10,
        processedBytes: 0,
        totalBytes: size,
        processedEntries: 0,
        processingSpeedMBps: 45,
        estimatedRemainingSeconds: 1,
      },
    });

    worker.onmessage = (e: MessageEvent) => {
      const { type, payload, result } = e.data;
      if (type === 'PROGRESS') {
        set({ parseProgress: payload });
        if (payload.phase === 'error') {
          set({ isParsing: false });
        }
      } else if (type === 'COMPLETE') {
        set({
          isParsing: false,
          logResult: result,
          activePage: 'overview',
        });
        trackDemoLoaded();
        trackPageView('overview');
      }
    };

    setTimeout(() => {
      worker.postMessage({
        type: 'PARSE_TEXT',
        text: demoText,
        fileName: 'mongod-production-demo.log.gz',
        fileSize: size,
      });
    }, 150);
  },

  setActivePage: (page: ActivePage) => {
    set({ activePage: page });
    trackPageView(page);
  },

  setFilters: (newFilters: Partial<FilterState>) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  selectQuery: (query: LogEntry | null) => {
    set({
      selectedQuery: query,
      isDrawerOpen: query !== null,
    });
    if (query) {
      trackSlowQueryInspected(query.planSummary || 'UNKNOWN', query.durationMillis || 0);
    }
  },

  setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),
  setCommandPaletteOpen: (open: boolean) => set({ isCommandPaletteOpen: open }),
  setShortcutsOpen: (open: boolean) => set({ isShortcutsOpen: open }),
  setExportOpen: (open: boolean) => set({ isExportOpen: open }),
  setTermsOpen: (open: boolean) => set({ isTermsOpen: open }),
  setPrivacyOpen: (open: boolean) => set({ isPrivacyOpen: open }),
  setContactOpen: (open: boolean) => set({ isContactOpen: open }),

  clearData: () => {
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }
    set({
      fileInfo: null,
      isParsing: false,
      logResult: null,
      selectedQuery: null,
      isDrawerOpen: false,
      filters: initialFilters,
    });
  },
}));
