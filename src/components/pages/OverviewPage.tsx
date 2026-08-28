import React, { useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import {
  Activity,
  AlertTriangle,
  Clock,
  Database,
  Layers,
  Zap,
  ArrowRight,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const setActivePage = useLogStore((state) => state.setActivePage);
  const selectQuery = useLogStore((state) => state.selectQuery);
  const setFilters = useLogStore((state) => state.setFilters);

  const [activeRange, setActiveRange] = useState<'5m' | '15m' | '1h' | '6h' | 'All'>('All');

  if (!logResult) return null;

  const { summary, timeline, operations, collections, slowQueries, errorGroups } = logResult;

  // Pie chart colors for operations
  const OP_COLORS = ['#38bdf8', '#a855f7', '#00ed64', '#f59e0b', '#ef4444', '#64748b'];

  const formatDuration = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms}ms`;
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Diagnostics Overview</span>
            <span className="text-xs font-mono font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              {summary.totalEntries.toLocaleString()} records
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time performance metrics, query latency distributions, and database bottlenecks
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-slate-400 bg-slate-900/90 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/10 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="truncate">
            {summary.timeRange?.start
              ? `${new Date(summary.timeRange.start).toLocaleTimeString()} → ${new Date(
                  summary.timeRange.end
                ).toLocaleTimeString()}`
              : 'Continuous Stream'}
          </span>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Entries */}
        <div className="p-3 sm:p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Total Entries</span>
            <Database className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white mb-1">
            {summary.totalEntries.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
            <span className="text-cyan-400 font-mono font-semibold">{summary.totalOperations.toLocaleString()}</span>
            <span className="truncate">CRUD commands</span>
          </div>
        </div>

        {/* Slow Queries */}
        <div
          onClick={() => setActivePage('slow-queries')}
          className="p-3 sm:p-4 rounded-xl glass-card cursor-pointer relative overflow-hidden group hover:border-orange-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Slow Queries (≥100ms)</span>
            <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-orange-400 mb-1">
            {summary.slowQueriesCount.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
            <span className="text-orange-400 font-mono font-semibold">
              {summary.totalEntries > 0
                ? `${((summary.slowQueriesCount / summary.totalEntries) * 100).toFixed(1)}%`
                : '0%'}
            </span>
            <span className="truncate">of queries</span>
          </div>
        </div>

        {/* Errors */}
        <div
          onClick={() => setActivePage('errors')}
          className="p-3 sm:p-4 rounded-xl glass-card cursor-pointer relative overflow-hidden group hover:border-red-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Errors & Warnings</span>
            <AlertTriangle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-red-400 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-red-400 mb-1">
            {summary.errorsCount.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
            <span className="text-red-400 font-mono font-semibold">{errorGroups.length}</span>
            <span className="truncate">signatures</span>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="p-3 sm:p-4 rounded-xl glass-card relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Avg Latency</span>
            <Zap className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-brand-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-brand-300 mb-1">
            {formatDuration(summary.avgDuration)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
            <span>P95: <strong className="text-slate-200">{formatDuration(summary.p95Duration)}</strong></span>
            <span>•</span>
            <span>P99: <strong className="text-slate-200">{formatDuration(summary.p99Duration)}</strong></span>
          </div>
        </div>
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
          <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">Peak Latency</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-red-400">
            {formatDuration(summary.maxDuration)}
          </span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
          <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">Active Collections</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-200">
            {summary.uniqueCollectionsCount} collections
          </span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
          <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">COLLSCANs</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">
            {collections.reduce((acc, c) => acc + c.collscanCount, 0).toLocaleString()} unindexed
          </span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
          <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">System Warnings</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">
            {summary.warningsCount} warnings
          </span>
        </div>
      </div>

      {/* Query Performance Timeline Chart */}
      <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-white/10 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              <span>Query Performance Timeline</span>
            </h3>
            <p className="text-xs text-slate-400">
              Average, P95 & P99 latency alongside slow query frequency over time
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-white/5 text-xs font-mono overflow-x-auto max-w-full">
            {(['5m', '15m', '1h', '6h', 'All'] as const).map((rng) => (
              <button
                key={rng}
                onClick={() => setActiveRange(rng)}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-colors shrink-0 text-xs ${
                  activeRange === rng
                    ? 'bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="p95Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ed64" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00ed64" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                unit="ms"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0f172a] border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                        <div className="font-mono font-bold text-slate-200 border-b border-white/10 pb-1">
                          {label}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                          <span className="text-slate-400">Total Queries:</span>
                          <span className="text-right text-slate-200 font-semibold">{data.total}</span>
                          <span className="text-slate-400">Avg Duration:</span>
                          <span className="text-right text-brand-400 font-semibold">{data.avgDuration} ms</span>
                          <span className="text-slate-400">P95 Duration:</span>
                          <span className="text-right text-orange-400 font-semibold">{data.p95Duration} ms</span>
                          <span className="text-slate-400">P99 Duration:</span>
                          <span className="text-right text-red-400 font-semibold">{data.p99Duration} ms</span>
                          <span className="text-slate-400">Slow Queries:</span>
                          <span className="text-right text-orange-400 font-semibold">{data.slowCount}</span>
                          <span className="text-slate-400">Errors:</span>
                          <span className="text-right text-red-400 font-semibold">{data.errorCount}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="p95Duration"
                name="P95 Duration"
                stroke="#f97316"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#p95Gradient)"
              />
              <Area
                type="monotone"
                dataKey="avgDuration"
                name="Avg Duration"
                stroke="#00ed64"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#avgGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-Column Grid: Operations Distribution & Top Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Operations Breakdown */}
        <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-white/10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Operations Breakdown</span>
            </h3>
            <button
              onClick={() => setActivePage('operations')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Donut Chart */}
            <div className="h-[180px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={operations}
                    dataKey="count"
                    nameKey="operation"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {operations.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={OP_COLORS[index % OP_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#0f172a] border border-white/15 px-3 py-1.5 rounded-lg text-xs font-mono">
                            <span className="uppercase text-brand-400 font-bold">{d.operation}</span>:{' '}
                            <span className="text-white">{d.count} ({d.percentage}%)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List with Click-to-filter */}
            <div className="space-y-1.5">
              {operations.slice(0, 5).map((op, idx) => (
                <div
                  key={op.operation}
                  onClick={() => {
                    setFilters({ selectedOperation: op.operation });
                    setActivePage('slow-queries');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: OP_COLORS[idx % OP_COLORS.length] }}
                    />
                    <span className="font-mono uppercase text-slate-200 font-medium group-hover:text-brand-300">
                      {op.operation}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-slate-400 text-[11px]">
                    <span className="text-slate-200">{op.count.toLocaleString()}</span>
                    <span>({op.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Slow Collections */}
        <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-white/10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Top Active Collections</span>
            </h3>
            <button
              onClick={() => setActivePage('collections')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              <span>All collections</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {collections.slice(0, 4).map((col) => (
              <div
                key={col.namespace}
                onClick={() => {
                  setFilters({ selectedNamespace: col.namespace });
                  setActivePage('slow-queries');
                }}
                className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors group gap-2"
              >
                <div className="min-w-0">
                  <div className="font-mono font-medium text-slate-200 group-hover:text-brand-300 truncate">
                    {col.namespace}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                    {col.queriesCount.toLocaleString()} queries • Avg: {col.avgDuration}ms
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {col.collscanCount > 0 && (
                    <span className="badge-collscan px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono">
                      {col.collscanCount} COLLSCAN
                    </span>
                  )}
                  {col.slowQueriesCount > 0 && (
                    <span className="badge-slow px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono">
                      {col.slowQueriesCount} slow
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Slow Queries Table Preview */}
      <div className="p-3.5 sm:p-5 rounded-2xl glass-panel border border-white/10 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Top Slowest Queries</span>
            </h3>
            <p className="text-xs text-slate-400">Click any query to open detailed inspection & index advice</p>
          </div>

          <button
            onClick={() => setActivePage('slow-queries')}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all {slowQueries.length} slow queries</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left text-xs min-w-[540px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px]">
                <th className="pb-2 font-medium">Latency</th>
                <th className="pb-2 font-medium">Operation</th>
                <th className="pb-2 font-medium">Namespace</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Docs Examined</th>
                <th className="pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {slowQueries.slice(0, 5).map((q) => (
                <tr
                  key={q.id}
                  onClick={() => selectQuery(q)}
                  className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="py-3 text-orange-400 font-bold">
                    {formatDuration(q.durationMillis || 0)}
                  </td>
                  <td className="py-3 uppercase text-brand-300 font-medium">
                    {q.operation}
                  </td>
                  <td className="py-3 text-slate-200 group-hover:text-brand-300 truncate max-w-[200px]">
                    {q.namespace}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] border ${
                        q.planSummary?.includes('COLLSCAN')
                          ? 'badge-collscan'
                          : q.planSummary?.includes('IXSCAN')
                          ? 'badge-ixscan'
                          : 'bg-white/5 text-slate-300 border-white/10'
                      }`}
                    >
                      {q.planSummary || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">
                    {q.docsExamined !== undefined ? q.docsExamined.toLocaleString() : 'N/A'}
                  </td>
                  <td className="py-3 text-slate-500 text-[11px]">
                    {q.timestamp ? new Date(q.timestamp).toLocaleTimeString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
