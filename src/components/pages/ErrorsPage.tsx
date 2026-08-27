import React, { useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

export const ErrorsPage: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const selectQuery = useLogStore((state) => state.selectQuery);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  if (!logResult) return null;

  const { errorGroups, summary } = logResult;

  const toggleGroup = (id: string) => {
    setExpandedGroupId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>Errors & Exceptions Hub</span>
            <span className="text-xs font-mono font-normal text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-500/30">
              {summary.errorsCount} total events
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Deduplicated error clusters, socket exceptions, failed write concerns, and timeouts
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl glass-card border border-white/10">
          <span className="text-xs text-slate-400 block mb-1">Total Error Occurrences</span>
          <span className="text-2xl font-bold font-mono text-red-400">
            {summary.errorsCount.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-white/10">
          <span className="text-xs text-slate-400 block mb-1">Unique Error Signatures</span>
          <span className="text-2xl font-bold font-mono text-slate-200">
            {errorGroups.length} distinct types
          </span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-white/10">
          <span className="text-xs text-slate-400 block mb-1">System Warnings</span>
          <span className="text-2xl font-bold font-mono text-amber-400">
            {summary.warningsCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Grouped Error List */}
      <div className="space-y-3">
        {errorGroups.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl glass-panel border border-white/10 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Zero Errors Detected</h3>
            <p className="text-xs text-slate-500">The analyzed log file contains no error or fatal severity records.</p>
          </div>
        ) : (
          errorGroups.map((group) => {
            const isExpanded = expandedGroupId === group.id;

            return (
              <div
                key={group.id}
                className="rounded-xl glass-card border border-white/10 overflow-hidden transition-all"
              >
                {/* Error Header Bar */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="badge-error px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          {group.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300 font-semibold uppercase">
                          {group.component}
                        </span>
                        {group.errorCode && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 border border-red-500/30 text-red-300">
                            Code {group.errorCode}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 font-mono">
                          Last seen: {new Date(group.lastSeen).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="font-mono text-xs text-red-200 truncate">{group.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="badge-error px-3 py-1 rounded-full font-mono text-xs font-bold shadow-sm">
                      × {group.count}
                    </span>
                  </div>
                </div>

                {/* Expanded Instances List */}
                {isExpanded && (
                  <div className="p-4 bg-[#070b13] border-t border-white/10 space-y-2 animate-fade-in">
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                      Sample Occurrences ({group.instances.length} shown)
                    </div>

                    <div className="space-y-2">
                      {group.instances.map((instance) => (
                        <div
                          key={instance.id}
                          onClick={() => selectQuery(instance)}
                          className="p-3 rounded-lg bg-black/40 border border-white/5 hover:border-red-500/30 cursor-pointer text-xs font-mono transition-colors group flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                              <span className="text-slate-300 font-semibold">Line #{instance.lineNumber}</span>
                              <span>•</span>
                              <span>{instance.timestamp}</span>
                              {instance.context && (
                                <>
                                  <span>•</span>
                                  <span className="text-cyan-400">{instance.context}</span>
                                </>
                              )}
                            </div>
                            <div className="text-slate-300 truncate text-[11px]">{instance.raw}</div>
                          </div>

                          <span className="text-[10px] font-sans text-slate-400 group-hover:text-red-400 shrink-0 flex items-center gap-0.5">
                            Inspect <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
