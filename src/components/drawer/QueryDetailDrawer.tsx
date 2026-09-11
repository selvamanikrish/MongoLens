import React, { useState, useMemo } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { analyzeQueryPerformance } from '../../lib/queryAnalyzer';
import { anonymizeCommandObject } from '../../lib/anonymizer';
import { formatDateTime } from '../../lib/formatters';
import {
  X,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  FileCode,
  Sparkles,
  Info,
  CheckCircle2,
  Terminal,
  Shield,
  Zap,
} from 'lucide-react';

export const QueryDetailDrawer: React.FC = () => {
  const selectedQuery = useLogStore((state) => state.selectedQuery);
  const isDrawerOpen = useLogStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useLogStore((state) => state.setDrawerOpen);

  const [copiedType, setCopiedType] = useState<'json' | 'raw' | 'index' | 'explain' | 'sanitized' | null>(null);

  const insights = useMemo(() => {
    if (!selectedQuery) return [];
    return analyzeQueryPerformance(selectedQuery);
  }, [selectedQuery]);

  if (!isDrawerOpen || !selectedQuery) return null;

  const copyToClipboard = (text: string, type: 'json' | 'raw' | 'index' | 'explain' | 'sanitized') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const durationMs = selectedQuery.durationMillis || 0;
  const durationText = durationMs >= 1000 ? `${(durationMs / 1000).toFixed(2)}s` : `${durationMs}ms`;

  const getPlanBadgeClass = (plan?: string) => {
    if (!plan) return 'bg-slate-800 text-slate-400 border-white/10';
    if (plan.includes('COLLSCAN')) return 'badge-collscan font-semibold';
    if (plan.includes('IXSCAN')) return 'badge-ixscan font-semibold';
    if (plan.includes('SORT')) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const formattedCommandJson = selectedQuery.command
    ? JSON.stringify(selectedQuery.command, null, 2)
    : selectedQuery.commandStr || selectedQuery.raw;

  return (
    <div
      onClick={() => setDrawerOpen(false)}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
    >
      <div
        className="w-full max-w-full sm:max-w-xl md:max-w-2xl bg-[#0b101c] border-l border-white/10 h-full flex flex-col shadow-2xl animate-slide-in-right overflow-y-auto overflow-x-hidden min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-[#090d16] flex items-center justify-between sticky top-0 z-10 gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 sm:gap-1.5 border shrink-0 ${
                durationMs >= 2000
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-glow-error'
                  : durationMs >= 500
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-glow-slow'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{durationText}</span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                <span className="uppercase text-brand-400 font-mono shrink-0">{selectedQuery.operation || 'QUERY'}</span>
                <span className="text-slate-500 font-normal shrink-0">on</span>
                <span className="font-mono text-slate-200 truncate">{selectedQuery.namespace || 'database'}</span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate" title={selectedQuery.timestamp}>
                Line #{selectedQuery.lineNumber} • {formatDateTime(selectedQuery.timestamp)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1 min-w-0 overflow-x-hidden">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-white/5 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-500 block mb-0.5 truncate">Execution Plan</span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] sm:text-xs font-mono border max-w-full truncate ${getPlanBadgeClass(selectedQuery.planSummary)}`}
                title={selectedQuery.planSummary || 'UNKNOWN'}
              >
                {selectedQuery.planSummary || 'UNKNOWN'}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-white/5 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-500 block mb-0.5 truncate">Docs Examined</span>
              <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-200 block truncate" title={selectedQuery.docsExamined?.toLocaleString()}>
                {selectedQuery.docsExamined !== undefined ? selectedQuery.docsExamined.toLocaleString() : 'N/A'}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-white/5 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-500 block mb-0.5 truncate">Keys Examined</span>
              <span className="text-[11px] sm:text-xs font-mono font-semibold text-slate-200 block truncate" title={selectedQuery.keysExamined?.toLocaleString()}>
                {selectedQuery.keysExamined !== undefined ? selectedQuery.keysExamined.toLocaleString() : 'N/A'}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-white/5 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-500 block mb-0.5 truncate">Docs Returned</span>
              <span className="text-[11px] sm:text-xs font-mono font-semibold text-brand-400 block truncate" title={selectedQuery.nReturned?.toLocaleString()}>
                {selectedQuery.nReturned !== undefined ? selectedQuery.nReturned.toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Context Details */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/60 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs min-w-0">
            <div className="min-w-0 overflow-hidden">
              <span className="text-slate-500 block text-[10px] uppercase font-mono truncate">Connection Context</span>
              <span className="text-slate-300 font-mono block truncate" title={selectedQuery.context}>{selectedQuery.context}</span>
            </div>
            <div className="min-w-0 overflow-hidden">
              <span className="text-slate-500 block text-[10px] uppercase font-mono truncate">Client Remote</span>
              <span className="text-slate-300 font-mono block truncate" title={selectedQuery.remote || 'Local / Cluster'}>{selectedQuery.remote || 'Local / Cluster'}</span>
            </div>
            <div className="min-w-0 overflow-hidden">
              <span className="text-slate-500 block text-[10px] uppercase font-mono truncate">Application Name</span>
              <span className="text-slate-300 font-mono truncate block" title={selectedQuery.appName || 'Unknown Client'}>{selectedQuery.appName || 'Unknown Client'}</span>
            </div>
          </div>

          {/* Intelligent Query Analysis & Insights Section */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono truncate">
                <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="truncate">Intelligent Performance Insights</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono shrink-0">{insights.length} findings</span>
            </div>

            <div className="space-y-2.5 min-w-0">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all min-w-0 overflow-hidden ${
                    insight.type === 'danger'
                      ? 'bg-red-950/20 border-red-500/30 text-red-200'
                      : insight.type === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : insight.type === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {insight.type === 'danger' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : insight.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : insight.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-1 text-xs min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-semibold text-white break-words">{insight.title}</span>
                        {insight.antiPattern && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 font-semibold shrink-0">
                            <Zap className="w-3 h-3 text-red-400" />
                            {insight.antiPattern.title}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed break-words">{insight.description}</p>
                      {insight.recommendation && (
                        <p className="text-slate-400 pt-1 text-[11px] break-words">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </p>
                      )}

                      {/* ESR Suggested Index Snippet */}
                      {insight.suggestedIndex && (
                        <div className="mt-3 p-2.5 sm:p-3 rounded-lg bg-black/60 border border-white/10 flex items-center justify-between gap-2 min-w-0 overflow-hidden">
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-[10px] uppercase font-mono text-brand-400 block mb-1">
                              Recommended ESR Index
                            </span>
                            <code className="text-xs font-mono text-brand-200 block truncate" title={insight.suggestedIndex}>{insight.suggestedIndex}</code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(insight.suggestedIndex!, 'index')}
                            className="p-1.5 rounded-md bg-white/10 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 transition-colors shrink-0"
                            title="Copy MongoDB Index Command"
                          >
                            {copiedType === 'index' ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* mongosh Explain Script Snippet */}
                      {insight.explainScript && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-black/60 border border-cyan-500/25 flex items-center justify-between gap-2 min-w-0 overflow-hidden">
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <span className="text-[10px] uppercase font-mono text-cyan-400 flex items-center gap-1 mb-0.5">
                              <Terminal className="w-3 h-3 shrink-0" /> <span className="truncate">mongosh Execution Stats</span>
                            </span>
                            <code className="text-[11px] font-mono text-cyan-200 block truncate" title={insight.explainScript}>{insight.explainScript}</code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(insight.explainScript!, 'explain')}
                            className="p-1.5 rounded-md bg-white/10 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors shrink-0"
                            title="Copy mongosh explain script"
                          >
                            {copiedType === 'explain' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formatted Command Payload */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Command Payload & Query Filter</span>
              </h4>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const sanitized = selectedQuery.command ? anonymizeCommandObject(selectedQuery.command) : selectedQuery.commandStr;
                    copyToClipboard(JSON.stringify(sanitized, null, 2), 'sanitized');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors border border-white/10"
                  title="Copy JSON with PII and literals masked"
                >
                  {copiedType === 'sanitized' ? <Check className="w-3 h-3 text-emerald-400" /> : <Shield className="w-3 h-3 text-brand-400" />}
                  <span>Sanitized</span>
                </button>
                <button
                  onClick={() => copyToClipboard(formattedCommandJson, 'json')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors border border-white/10"
                >
                  {copiedType === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={() => copyToClipboard(selectedQuery.raw, 'raw')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition-colors border border-white/10"
                >
                  {copiedType === 'raw' ? <Check className="w-3 h-3 text-emerald-400" /> : <Terminal className="w-3 h-3" />}
                  <span>Copy Log</span>
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-[#070a12] border border-white/10 font-mono text-xs overflow-x-auto max-w-full max-h-[300px] text-slate-200 min-w-0">
              <pre className="whitespace-pre font-mono">{formattedCommandJson}</pre>
            </div>
          </div>

          {/* Raw Log Line */}
          <div className="space-y-2 min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Raw MongoDB Log Entry
            </h4>
            <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-[11px] font-mono text-slate-400 break-all overflow-hidden max-w-full">
              {selectedQuery.raw}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
