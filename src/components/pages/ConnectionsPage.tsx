import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Network,
  Users,
  AlertTriangle,
  Server,
  Activity,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

export const ConnectionsPage: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const connections = logResult?.connections;

  if (!logResult || !connections) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Network className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm">No connection diagnostic data available in this log file.</p>
      </div>
    );
  }

  const {
    totalAccepted,
    totalClosed,
    maxConcurrent,
    currentEstimated,
    timeline,
    topApps,
    topRemotes,
    socketErrors,
  } = connections;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
          <Network className="w-5 h-5 text-brand-400" />
          Connections & Client Topology
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor connection pool utilization, driver connection storms, top application consumers, and socket terminations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Peak Concurrent</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {maxConcurrent.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Est. Current: {currentEstimated.toLocaleString()} active
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Connections Accepted</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {totalAccepted.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            New client handshakes
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Connections Closed</span>
            <ArrowDownRight className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300">
            {totalClosed.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Cleanly ended connections
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Socket Drop / Resets</span>
            <AlertTriangle className={`w-4 h-4 ${socketErrors.length > 0 ? 'text-red-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${socketErrors.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {socketErrors.reduce((sum, e) => sum + e.count, 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {socketErrors.length} distinct drop patterns
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      {timeline.length > 1 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b101c] border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
              <Activity className="w-4 h-4 text-brand-400" />
              Active Connections Volume Over Time
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">60-second intervals</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="connGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#ffffff20',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                  itemStyle={{ color: '#10b981' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="activeConnections"
                  name="Active Connections"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#connGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two Column Grid: Top Client Apps & Top Client IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Client Applications */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b101c] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              Top Client Applications (appName)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">{topApps.length} clients</span>
          </div>

          <div className="space-y-3">
            {topApps.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No explicit appName metadata recorded in log stream.</p>
            ) : (
              topApps.map((app) => (
                <div key={app.appName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-200 font-semibold truncate max-w-[200px]">{app.appName}</span>
                    <div className="flex items-center gap-2 font-mono text-slate-400 text-[11px]">
                      {app.slowQueriesCount > 0 && (
                        <span className="text-orange-400 bg-orange-500/15 px-1.5 py-0.2 rounded border border-orange-500/30">
                          {app.slowQueriesCount} slow
                        </span>
                      )}
                      <span>{app.count.toLocaleString()} ops ({app.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.max(2, app.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Remote Hosts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b101c] border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
              <Server className="w-4 h-4 text-brand-400" />
              Client Remote IP Distribution
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">{topRemotes.length} hosts</span>
          </div>

          <div className="space-y-3">
            {topRemotes.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No client remote IP addresses recorded.</p>
            ) : (
              topRemotes.map((remote) => (
                <div key={remote.remoteHost} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-200 font-semibold">{remote.remoteHost}</span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {remote.count.toLocaleString()} ops ({remote.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-brand-400 rounded-full"
                      style={{ width: `${Math.max(2, remote.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Socket Termination & Errors Section */}
      {socketErrors.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2 font-mono">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Socket Exceptions & Disconnection Warnings ({socketErrors.length})
          </h3>
          <div className="divide-y divide-white/5">
            {socketErrors.map((err, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs font-mono">
                <div className="min-w-0">
                  <div className="text-slate-200 truncate">{err.message}</div>
                  <div className="text-[11px] text-slate-500">
                    Last seen: {err.lastSeen} {err.remote && `• Remote: ${err.remote}`}
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold shrink-0">
                  {err.count}x
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
