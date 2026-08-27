import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { Clock, Activity, Zap } from 'lucide-react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const TimelinePage: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const selectQuery = useLogStore((state) => state.selectQuery);

  if (!logResult) return null;

  const { timeline, summary, slowQueries } = logResult;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            <span>Event Timeline & Traffic Spikes</span>
          </h1>
          <p className="text-xs text-slate-400">
            Chronological distribution of throughput volume, slow queries, and database errors
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10">
          <span>
            {summary.timeRange?.start
              ? `${new Date(summary.timeRange.start).toLocaleTimeString()} → ${new Date(
                  summary.timeRange.end
                ).toLocaleTimeString()}`
              : 'Active Range'}
          </span>
        </div>
      </div>

      {/* Main Composed Chart */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" />
            <span>Query Traffic, Latency & Failure Correlation</span>
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-brand-400">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              <span>Throughput</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Slow Queries</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Errors</span>
            </div>
          </div>
        </div>

        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f97316"
                tick={{ fontSize: 10, fill: '#f97316' }}
                tickLine={false}
                unit="ms"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#0f172a] border border-white/15 p-3 rounded-xl shadow-2xl text-xs space-y-1 font-mono">
                        <div className="font-bold text-slate-200 border-b border-white/10 pb-1">{label}</div>
                        <div className="text-cyan-400">Total Throughput: {d.total} queries</div>
                        <div className="text-orange-400">Slow Queries: {d.slowCount}</div>
                        <div className="text-red-400">Errors: {d.errorCount}</div>
                        <div className="text-brand-300">Avg Duration: {d.avgDuration} ms</div>
                        <div className="text-amber-400">P95 Duration: {d.p95Duration} ms</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar yAxisId="left" dataKey="total" fill="#00ed64" opacity={0.3} radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="slowCount" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="errorCount" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="p95Duration" stroke="#fb923c" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chronological Highlights */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Major Event Chronology</span>
        </h3>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
          {slowQueries.slice(0, 6).map((q) => (
            <div
              key={q.id}
              onClick={() => selectQuery(q)}
              className="relative group cursor-pointer"
            >
              {/* Timeline marker dot */}
              <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#0b101c] border-2 border-orange-400 group-hover:scale-125 transition-transform shadow-glow-slow" />

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 group-hover:border-orange-500/30 transition-all flex items-center justify-between gap-3 text-xs font-mono">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-0.5">
                    <span className="text-brand-300 font-semibold">{q.timestamp}</span>
                    <span>•</span>
                    <span className="text-orange-400 font-bold">{q.durationMillis}ms latency</span>
                  </div>
                  <div className="text-slate-200">
                    <span className="uppercase text-cyan-400 font-bold">{q.operation}</span> on{' '}
                    <span className="text-white font-semibold">{q.namespace}</span>{' '}
                    <span className="text-slate-500">({q.planSummary || 'COLLSCAN'})</span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 group-hover:text-brand-400 font-sans shrink-0">
                  Inspect →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
