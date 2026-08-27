import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { useFilteredLogs } from '../../hooks/useFilteredLogs';
import {
  Search,
  Download,
  HelpCircle,
  X,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const fileInfo = useLogStore((state) => state.fileInfo);
  const filters = useLogStore((state) => state.filters);
  const setFilters = useLogStore((state) => state.setFilters);
  const resetFilters = useLogStore((state) => state.resetFilters);
  const setCommandPaletteOpen = useLogStore((state) => state.setCommandPaletteOpen);
  const setShortcutsOpen = useLogStore((state) => state.setShortcutsOpen);
  const setExportOpen = useLogStore((state) => state.setExportOpen);
  const { count, totalOriginal } = useFilteredLogs();

  const isFiltered =
    filters.searchQuery !== '' ||
    filters.minDurationMs > 0 ||
    filters.selectedNamespace !== 'ALL' ||
    filters.selectedOperation !== 'ALL' ||
    filters.selectedSeverity !== 'ALL' ||
    filters.selectedPlan !== 'ALL' ||
    filters.onlySlowQueries ||
    filters.onlyErrors;

  return (
    <header className="h-14 bg-[#090d14]/90 backdrop-blur-md border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-20 gap-4">
      {/* Left: Active File & Match count */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-slate-200 truncate max-w-[180px] sm:max-w-[240px]">
            {fileInfo?.name || 'mongod.log'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
          <span className="text-slate-200 font-semibold">{count.toLocaleString()}</span>
          <span>/</span>
          <span>{totalOriginal.toLocaleString()} logs</span>
        </div>
      </div>

      {/* Center: Search Bar Trigger (Cmd+K) */}
      <div className="flex-1 max-w-xl">
        <div
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 hover:border-brand-500/40 text-slate-400 hover:text-slate-200 text-xs cursor-pointer transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2 flex-1 truncate">
            <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors shrink-0" />
            <span className="truncate">
              {filters.searchQuery ? (
                <span className="text-brand-300 font-mono">{filters.searchQuery}</span>
              ) : (
                'Search logs, namespaces, operations, commands...'
              )}
            </span>
          </div>

          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 shrink-0">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right: Quick Filter Pills & Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Filter: Slow only */}
        <button
          onClick={() => setFilters({ onlySlowQueries: !filters.onlySlowQueries })}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
            filters.onlySlowQueries
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-semibold'
              : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
        >
          <span>Slow</span>
        </button>

        {/* Quick Filter: Errors only */}
        <button
          onClick={() => setFilters({ onlyErrors: !filters.onlyErrors })}
          className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
            filters.onlyErrors
              ? 'bg-red-500/20 text-red-300 border-red-500/40 font-semibold'
              : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
        >
          <span>Errors</span>
        </button>

        {/* Reset filters pill if active */}
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/15 text-slate-300 border border-white/15 text-xs transition-colors"
            title="Reset all active filters"
          >
            <X className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

        {/* Export Modal Trigger */}
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
          title="Export logs and diagnostic reports"
        >
          <Download className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Keyboard Shortcuts Help */}
        <button
          onClick={() => setShortcutsOpen(true)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 text-xs transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
