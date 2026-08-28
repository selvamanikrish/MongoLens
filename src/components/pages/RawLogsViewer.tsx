import React, { useRef, useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { useFilteredLogs } from '../../hooks/useFilteredLogs';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Terminal,
  Copy,
  Check,
  ArrowDownToLine,
  RotateCcw,
} from 'lucide-react';

export const RawLogsViewer: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const selectQuery = useLogStore((state) => state.selectQuery);
  const filters = useLogStore((state) => state.filters);
  const setFilters = useLogStore((state) => state.setFilters);
  const resetFilters = useLogStore((state) => state.resetFilters);

  const { filteredEntries } = useFilteredLogs();

  const parentRef = useRef<HTMLDivElement>(null);
  const [jumpLine, setJumpLine] = useState('');
  const [copiedLineId, setCopiedLineId] = useState<string | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 25,
  });

  if (!logResult) return null;

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const lineNum = parseInt(jumpLine, 10);
    if (!isNaN(lineNum) && lineNum > 0 && lineNum <= filteredEntries.length) {
      rowVirtualizer.scrollToIndex(lineNum - 1, { align: 'center' });
    }
  };

  const copyLine = (entry: any, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(entry.raw);
    setCopiedLineId(entry.id);
    setTimeout(() => setCopiedLineId(null), 1500);
  };

  const severities = ['ALL', 'I', 'W', 'E', 'D'];

  return (
    <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 max-w-7xl mx-auto h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Top Console Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-400 shrink-0" />
            <span>Raw Logs Virtual Console</span>
            <span className="text-xs font-mono font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              {filteredEntries.length.toLocaleString()} lines
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            60 FPS virtualized rendering for massive MongoDB logs with syntax highlighting and line jumping
          </p>
        </div>

        {/* Console Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Jump to Line */}
          <form onSubmit={handleJump} className="flex items-center gap-1">
            <div className="relative">
              <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                value={jumpLine}
                onChange={(e) => setJumpLine(e.target.value)}
                placeholder="Line..."
                className="w-24 sm:w-32 bg-slate-900 border border-white/10 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono"
            >
              Go
            </button>
          </form>

          {/* Severity Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/10">
            {severities.map((sev) => (
              <button
                key={sev}
                onClick={() => setFilters({ selectedSeverity: sev })}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  filters.selectedSeverity === sev
                    ? sev === 'E'
                      ? 'bg-red-500/20 text-red-300 font-bold'
                      : sev === 'W'
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'bg-brand-500/20 text-brand-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={resetFilters}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Virtualized Terminal Console Container */}
      <div
        ref={parentRef}
        className="flex-1 w-full bg-[#070b13] border border-white/10 rounded-2xl overflow-auto font-mono text-xs shadow-2xl relative select-text"
      >
        {filteredEntries.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500 space-y-2">
            <p>No log records match current console filters.</p>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-300 font-mono text-xs border border-brand-500/30"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              minWidth: '600px',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const entry = filteredEntries[virtualRow.index];
              const isSelected = copiedLineId === entry.id;

              return (
                <div
                  key={entry.id}
                  onClick={() => selectQuery(entry)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`flex items-center hover:bg-white/5 px-3 py-1.5 cursor-pointer border-b border-white/[0.03] transition-colors group ${
                    entry.isError
                      ? 'bg-red-950/20 text-red-200'
                      : entry.isSlowQuery
                      ? 'bg-orange-950/15 text-orange-200'
                      : entry.isWarning
                      ? 'bg-amber-950/15 text-amber-200'
                      : 'text-slate-300'
                  }`}
                >
                  {/* Line Number */}
                  <span className="w-14 shrink-0 text-slate-600 text-right pr-4 select-none font-mono text-[11px]">
                    {entry.lineNumber}
                  </span>

                  {/* Timestamp */}
                  <span className="w-36 shrink-0 text-slate-400 text-[11px] truncate select-none">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : 'N/A'}
                  </span>

                  {/* Severity Badge */}
                  <span
                    className={`w-6 text-center shrink-0 font-bold text-[10px] rounded px-1 mr-2 select-none ${
                      entry.severity === 'E' || entry.severity === 'F'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : entry.severity === 'W'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {entry.severity}
                  </span>

                  {/* Component */}
                  <span className="w-20 shrink-0 text-slate-400 uppercase text-[10px] font-semibold truncate select-none">
                    {entry.component}
                  </span>

                  {/* Log Content / Raw line */}
                  <span className="flex-1 truncate font-mono text-[11px] text-slate-200 pr-2">
                    {entry.raw}
                  </span>

                  {/* Quick Copy Action */}
                  <button
                    onClick={(e) => copyLine(entry, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-opacity shrink-0 ml-2"
                    title="Copy Line"
                  >
                    {isSelected ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
