import React, { useState, useMemo } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { useFilteredLogs } from '../../hooks/useFilteredLogs';
import {
  Gauge,
  Flame,
  ArrowUpDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export const SlowQueriesPage: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const filters = useLogStore((state) => state.filters);
  const setFilters = useLogStore((state) => state.setFilters);
  const resetFilters = useLogStore((state) => state.resetFilters);
  const selectQuery = useLogStore((state) => state.selectQuery);
  const { filteredSlowQueries } = useFilteredLogs();

  const [sortBy, setSortBy] = useState<'duration' | 'time' | 'docs'>('duration');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const sortedQueries = useMemo(() => {
    return [...filteredSlowQueries].sort((a, b) => {
      let diff = 0;
      if (sortBy === 'duration') {
        diff = (b.durationMillis || 0) - (a.durationMillis || 0);
      } else if (sortBy === 'time') {
        diff = b.parsedDate - a.parsedDate;
      } else if (sortBy === 'docs') {
        diff = (b.docsExamined || 0) - (a.docsExamined || 0);
      }
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [filteredSlowQueries, sortBy, sortOrder]);

  if (!logResult) return null;

  const durationPresets = [100, 250, 500, 1000, 5000];
  const plans = ['ALL', 'COLLSCAN', 'IXSCAN', 'SORT', 'FETCH'];

  const formatDuration = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span>Slow Query Analysis</span>
            <span className="text-xs font-mono font-normal text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded-md border border-orange-500/30">
              {sortedQueries.length} found
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Identify unindexed scans, inefficient key examinations, and long-running aggregation pipelines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Controls */}
      <div className="p-4 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Min Duration Presets */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Minimum Latency ({filters.minDurationMs}ms)
            </label>
            <div className="flex items-center gap-1">
              {durationPresets.map((ms) => (
                <button
                  key={ms}
                  onClick={() => setFilters({ minDurationMs: filters.minDurationMs === ms ? 0 : ms })}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors border ${
                    filters.minDurationMs === ms
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold'
                      : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200'
                  }`}
                >
                  {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                </button>
              ))}
            </div>
          </div>

          {/* Operation Dropdown */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Operation Type
            </label>
            <select
              value={filters.selectedOperation}
              onChange={(e) => setFilters({ selectedOperation: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Operations</option>
              {logResult.summary.uniqueOperations.map((op) => (
                <option key={op} value={op}>
                  {op.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Namespace Dropdown */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Collection Namespace
            </label>
            <select
              value={filters.selectedNamespace}
              onChange={(e) => setFilters({ selectedNamespace: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500 truncate"
            >
              <option value="ALL">All Namespaces ({logResult.collections.length})</option>
              {logResult.collections.map((col) => (
                <option key={col.namespace} value={col.namespace}>
                  {col.namespace} ({col.queriesCount})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Sort Order
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
              >
                <option value="duration">Latency (Duration)</option>
                <option value="docs">Docs Examined</option>
                <option value="time">Timestamp (Recency)</option>
              </select>
              <button
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white"
                title={`Sort ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Plan Summary Badge Filter Pills */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">Execution Plan:</span>
          {plans.map((plan) => (
            <button
              key={plan}
              onClick={() => setFilters({ selectedPlan: plan })}
              className={`px-2.5 py-0.5 rounded text-xs font-mono transition-colors border ${
                filters.selectedPlan === plan
                  ? plan === 'COLLSCAN'
                    ? 'badge-collscan font-bold'
                    : 'bg-brand-500/20 text-brand-300 border-brand-500/40 font-bold'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200'
              }`}
            >
              {plan}
            </button>
          ))}
        </div>
      </div>

      {/* Slow Queries Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-xl">
        {sortedQueries.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto">
              <Gauge className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No Slow Queries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No queries match your current latency and filter parameters. Try lowering the minimum duration filter or resetting filters.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-brand-500/20 text-brand-300 font-mono text-xs border border-brand-500/30"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#090d16] border-b border-white/10 text-slate-400 font-mono text-[11px]">
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Operation</th>
                  <th className="py-3 px-4 font-semibold">Namespace</th>
                  <th className="py-3 px-4 font-semibold">Plan Summary</th>
                  <th className="py-3 px-4 font-semibold">Docs Examined</th>
                  <th className="py-3 px-4 font-semibold">Docs Returned</th>
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {sortedQueries.map((q) => {
                  const durationMs = q.durationMillis || 0;
                  const isCritical = durationMs >= 3000;
                  const isWarning = durationMs >= 500;

                  return (
                    <tr
                      key={q.id}
                      onClick={() => selectQuery(q)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      {/* Latency badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                            isCritical
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : isWarning
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                          }`}
                        >
                          {formatDuration(durationMs)}
                        </span>
                      </td>

                      {/* Operation */}
                      <td className="py-3.5 px-4 uppercase text-brand-300 font-semibold">
                        {q.operation}
                      </td>

                      {/* Namespace */}
                      <td className="py-3.5 px-4 text-slate-200 font-medium group-hover:text-brand-300 truncate max-w-[220px]">
                        {q.namespace || 'default'}
                      </td>

                      {/* Plan Summary Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] border ${
                            q.planSummary?.includes('COLLSCAN')
                              ? 'badge-collscan font-bold'
                              : q.planSummary?.includes('IXSCAN')
                              ? 'badge-ixscan font-bold'
                              : q.planSummary?.includes('SORT')
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-white/5 text-slate-300 border-white/10'
                          }`}
                        >
                          {q.planSummary || 'UNKNOWN'}
                        </span>
                      </td>

                      {/* Docs Examined */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {q.docsExamined !== undefined ? q.docsExamined.toLocaleString() : 'N/A'}
                      </td>

                      {/* Returned */}
                      <td className="py-3.5 px-4 text-brand-400">
                        {q.nReturned !== undefined ? q.nReturned.toLocaleString() : 'N/A'}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {q.timestamp ? new Date(q.timestamp).toLocaleTimeString() : 'N/A'}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[11px] text-slate-400 group-hover:text-brand-400 font-sans inline-flex items-center gap-0.5">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
