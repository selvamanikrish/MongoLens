import React, { useState, useMemo } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { compareLogResults } from '../../lib/diffEngine';
import type { QueryComparisonItem } from '../../types';
import {
  GitCompare,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCcw,
  Upload,
  FileCheck,
  Zap,
} from 'lucide-react';

export const ComparePage: React.FC = () => {
  const currentResult = useLogStore((state) => state.logResult);
  const currentFileInfo = useLogStore((state) => state.fileInfo);
  const baselineResult = useLogStore((state) => state.baselineResult);
  const baselineFileInfo = useLogStore((state) => state.baselineFileInfo);
  const setBaselineLog = useLogStore((state) => state.setBaselineLog);
  const clearBaselineLog = useLogStore((state) => state.clearBaselineLog);
  const selectQuery = useLogStore((state) => state.selectQuery);

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'resolved' | 'regressed' | 'improved' | 'new'>('all');

  const comparison = useMemo(() => {
    if (!currentResult || !baselineResult) return null;
    return compareLogResults(
      baselineResult,
      baselineFileInfo?.name || 'Baseline Log',
      currentResult,
      currentFileInfo?.name || 'Current Log'
    );
  }, [currentResult, currentFileInfo, baselineResult, baselineFileInfo]);

  const handleSetCurrentAsBaseline = () => {
    if (currentResult && currentFileInfo) {
      setBaselineLog(currentResult, currentFileInfo);
    }
  };

  const handleUploadBaselineFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.mongolens')) {
      const text = await file.text();
      try {
        const session = JSON.parse(text);
        if (session.logResult && session.fileInfo) {
          setBaselineLog(session.logResult, session.fileInfo);
        }
      } catch (err) {
        console.error('Failed to parse .mongolens baseline file:', err);
      }
    } else {
      alert('To set an external baseline, please load the baseline log file first and click "Set Current as Baseline", or upload a saved .mongolens session.');
    }
  };

  if (!currentResult) {
    return (
      <div className="p-12 text-center text-slate-400">
        <GitCompare className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm">Please load a log file first to use the comparison tool.</p>
      </div>
    );
  }

  // If no baseline has been assigned yet
  if (!baselineResult || !comparison) {
    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto py-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto mb-4">
            <GitCompare className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
            Before vs. After Log Comparison
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Validate performance after adding an index, tuning queries, or deploying a release by comparing two log snapshots side-by-side.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b101c] border border-white/10 space-y-5">
          <div className="flex items-center gap-3 text-slate-200 text-sm">
            <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">Current Loaded File:</span>{' '}
              <span className="font-mono text-brand-300">{currentFileInfo?.name || 'mongod.log'}</span>
              <div className="text-xs text-slate-400 mt-0.5">
                {currentResult.summary.totalEntries.toLocaleString()} entries • p95: {currentResult.summary.p95Duration}ms • {currentResult.summary.slowQueriesCount} slow queries
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Choose Comparison Workflow:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSetCurrentAsBaseline}
                className="p-4 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-left transition-all group"
              >
                <div className="font-semibold text-white text-sm flex items-center justify-between mb-1">
                  <span>1. Set as Baseline</span>
                  <CheckCircle2 className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pin current file as the "Before" baseline, then upload your "After" log file to see the diff.
                </p>
              </button>

              <label className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all cursor-pointer group">
                <div className="font-semibold text-white text-sm flex items-center justify-between mb-1">
                  <span>2. Import Baseline Session</span>
                  <Upload className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a previously saved <code className="text-cyan-300">.mongolens</code> session as baseline.
                </p>
                <input
                  type="file"
                  accept=".mongolens,.json"
                  onChange={handleUploadBaselineFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Comparison Dashboard
  const { metrics, queryDiffs } = comparison;

  const filteredDiffs = queryDiffs.filter((q) => {
    if (selectedStatusFilter === 'all') return true;
    return q.status === selectedStatusFilter;
  });

  const resolvedCount = queryDiffs.filter((q) => q.status === 'resolved').length;
  const regressedCount = queryDiffs.filter((q) => q.status === 'regressed').length;
  const improvedCount = queryDiffs.filter((q) => q.status === 'improved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Comparison Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
            <GitCompare className="w-5 h-5 text-brand-400" />
            Before vs. After Delta Comparison
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
            <span className="text-slate-300 font-semibold">{baselineFileInfo?.name}</span>
            <span className="text-slate-600">vs</span>
            <span className="text-brand-300 font-semibold">{currentFileInfo?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearBaselineLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Delta Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* P95 Latency Delta */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>P95 Latency Delta</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.p95.candidate}ms
            </span>
            <span className={`text-xs font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
              metrics.p95.improved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : metrics.p95.delta === 0
                ? 'bg-slate-800 text-slate-400'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {metrics.p95.improved ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              {Math.abs(metrics.p95.percentChange)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Baseline: {metrics.p95.baseline}ms ({metrics.p95.delta > 0 ? `+${metrics.p95.delta}` : metrics.p95.delta}ms)
          </div>
        </div>

        {/* P99 Latency Delta */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>P99 Latency Delta</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.p99.candidate}ms
            </span>
            <span className={`text-xs font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
              metrics.p99.improved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : metrics.p99.delta === 0
                ? 'bg-slate-800 text-slate-400'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {metrics.p99.improved ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              {Math.abs(metrics.p99.percentChange)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Baseline: {metrics.p99.baseline}ms
          </div>
        </div>

        {/* Slow Queries Delta */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>Slow Queries Delta</span>
            <Zap className="w-4 h-4 text-orange-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.slowQueriesCount.candidate.toLocaleString()}
            </span>
            <span className={`text-xs font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
              metrics.slowQueriesCount.improved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : metrics.slowQueriesCount.delta === 0
                ? 'bg-slate-800 text-slate-400'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {metrics.slowQueriesCount.improved ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              {Math.abs(metrics.slowQueriesCount.percentChange)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Baseline: {metrics.slowQueriesCount.baseline.toLocaleString()}
          </div>
        </div>

        {/* COLLSCAN Scans Delta */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            <span>COLLSCANs Delta</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.collscanCount.candidate > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.collscanCount.candidate.toLocaleString()}
            </span>
            <span className={`text-xs font-mono font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
              metrics.collscanCount.improved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : metrics.collscanCount.delta === 0
                ? 'bg-slate-800 text-slate-400'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {metrics.collscanCount.improved ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
              {Math.abs(metrics.collscanCount.percentChange)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Baseline: {metrics.collscanCount.baseline.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Query Regression & Fix Matrix */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0b101c] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 font-mono">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">Query Performance Diff Matrix</h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedStatusFilter === 'all'
                  ? 'bg-white/15 text-white font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              All ({queryDiffs.length})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('resolved')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedStatusFilter === 'resolved'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-emerald-300'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('regressed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedStatusFilter === 'regressed'
                  ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-red-300'
              }`}
            >
              Regressed ({regressedCount})
            </button>
            <button
              onClick={() => setSelectedStatusFilter('improved')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                selectedStatusFilter === 'improved'
                  ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-blue-300'
              }`}
            >
              Improved ({improvedCount})
            </button>
          </div>
        </div>

        {/* Diff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="pb-2">Status</th>
                <th className="pb-2">Operation</th>
                <th className="pb-2">Namespace</th>
                <th className="pb-2">Baseline Avg</th>
                <th className="pb-2">Candidate Avg</th>
                <th className="pb-2">Delta</th>
                <th className="pb-2 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDiffs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No query patterns match the selected diff filter.
                  </td>
                </tr>
              ) : (
                filteredDiffs.map((diff, idx) => {
                  const getStatusBadge = (status: QueryComparisonItem['status']) => {
                    switch (status) {
                      case 'resolved':
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            FIXED
                          </span>
                        );
                      case 'regressed':
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            SLOWER
                          </span>
                        );
                      case 'improved':
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            FASTER
                          </span>
                        );
                      case 'new':
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            NEW
                          </span>
                        );
                      default:
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            SAME
                          </span>
                        );
                    }
                  };

                  return (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5">{getStatusBadge(diff.status)}</td>
                      <td className="py-2.5 font-bold text-slate-300 uppercase">{diff.operation}</td>
                      <td className="py-2.5 text-brand-300 font-semibold">{diff.namespace}</td>
                      <td className="py-2.5 text-slate-400">
                        {diff.baselineAvgMs !== undefined ? `${diff.baselineAvgMs}ms` : '—'}
                      </td>
                      <td className="py-2.5 text-slate-200">
                        {diff.candidateAvgMs !== undefined ? `${diff.candidateAvgMs}ms` : '—'}
                      </td>
                      <td className="py-2.5">
                        {diff.deltaMs !== undefined ? (
                          <span className={diff.deltaMs < 0 ? 'text-emerald-400 font-bold' : diff.deltaMs > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                            {diff.deltaMs > 0 ? `+${diff.deltaMs}` : diff.deltaMs}ms ({diff.percentChange}%)
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => selectQuery(diff.sampleEntry)}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-brand-500/20 hover:text-brand-300 text-slate-400 text-[11px] transition-colors border border-white/10"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
