import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { Layers, ArrowRight, Flame, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const OperationsPage: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const setActivePage = useLogStore((state) => state.setActivePage);
  const setFilters = useLogStore((state) => state.setFilters);

  if (!logResult) return null;

  const { operations, summary } = logResult;

  const colors = ['#38bdf8', '#a855f7', '#00ed64', '#f59e0b', '#ef4444', '#64748b', '#06b6d4'];

  const chartData = operations.map((op) => ({
    name: op.operation.toUpperCase(),
    count: op.count,
    avg: op.avgDuration,
    p95: op.p95Duration,
    slow: op.slowCount,
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>Operations Breakdown</span>
          </h1>
          <p className="text-xs text-slate-400">
            Distribution of CRUD commands, aggregations, latency percentiles, and slow query ratios
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10">
          <span>Total: <strong className="text-white">{summary.totalOperations.toLocaleString()}</strong> ops</span>
        </div>
      </div>

      {/* Latency Comparison Bar Chart */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-400" />
            <span>Average vs P95 Latency by Command (ms)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Operations: {operations.length}</span>
        </div>

        <div className="h-[260px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} unit="ms" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#0f172a] border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1 font-mono">
                        <div className="font-bold text-brand-400 uppercase">{label}</div>
                        <div className="text-slate-300">Total Calls: {d.count.toLocaleString()}</div>
                        <div className="text-emerald-400">Avg Duration: {d.avg} ms</div>
                        <div className="text-orange-400">P95 Duration: {d.p95} ms</div>
                        <div className="text-red-400">Slow Queries: {d.slow.toLocaleString()}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avg" fill="#00ed64" radius={[4, 4, 0, 0]} name="Avg Duration" />
              <Bar dataKey="p95" fill="#f97316" radius={[4, 4, 0, 0]} name="P95 Duration" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of Operation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operations.map((op, idx) => (
          <div
            key={op.operation}
            className="p-4 rounded-xl glass-card border border-white/10 space-y-3 relative group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[idx % colors.length] }}
                />
                <span className="font-mono text-sm uppercase font-bold text-white">
                  {op.operation}
                </span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                {op.percentage}% of total
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60">
                <span className="text-slate-500 block text-[10px]">Calls</span>
                <span className="font-mono font-bold text-slate-200">{op.count.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60">
                <span className="text-slate-500 block text-[10px]">Avg Latency</span>
                <span className="font-mono font-bold text-brand-300">{op.avgDuration}ms</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60">
                <span className="text-slate-500 block text-[10px]">P95 Latency</span>
                <span className="font-mono font-bold text-orange-400">{op.p95Duration}ms</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>{op.slowCount} slow queries</span>
              </div>

              <button
                onClick={() => {
                  setFilters({ selectedOperation: op.operation });
                  setActivePage('slow-queries');
                }}
                className="text-brand-400 hover:text-brand-300 font-medium text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                <span>Filter logs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
