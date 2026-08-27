import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { Loader2, Zap, FileArchive, CheckCircle2, AlertTriangle } from 'lucide-react';

export const FileUploadProgress: React.FC = () => {
  const parseProgress = useLogStore((state) => state.parseProgress);
  const fileInfo = useLogStore((state) => state.fileInfo);

  const {
    phase,
    progress,
    decompressionProgress,
    processedEntries,
    processingSpeedMBps,
    estimatedRemainingSeconds,
    errorMessage,
  } = parseProgress;

  const isGz = fileInfo?.name.endsWith('.gz') || fileInfo?.name.endsWith('.zip');

  if (phase === 'error') {
    return (
      <div className="max-w-xl w-full mx-auto p-6 rounded-xl bg-red-950/40 border border-red-500/30 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-red-200 mb-2">Parsing Error</h3>
        <p className="text-sm text-red-300/80 mb-4">
          {errorMessage || "We couldn't parse this log file. The file may use an unsupported or corrupted format."}
        </p>
        <button
          onClick={() => useLogStore.getState().clearData()}
          className="px-4 py-2 text-xs font-medium bg-red-900/60 hover:bg-red-800 text-red-100 rounded-lg transition-colors"
        >
          Try Another File
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto p-6 rounded-2xl glass-panel border border-white/10 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
            {phase === 'decompressing' ? (
              <FileArchive className="w-5 h-5 animate-pulse" />
            ) : phase === 'complete' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{fileInfo?.name || 'Processing Log File'}</h4>
            <p className="text-xs text-slate-400">
              {fileInfo?.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : 'Streaming file'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-mono font-bold text-brand-400">{progress}%</span>
          <p className="text-xs text-slate-400 capitalize">{phase}...</p>
        </div>
      </div>

      {/* Progress Bars */}
      {isGz && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Decompressing GZIP stream</span>
            <span className="font-mono text-slate-300">{decompressionProgress || 100}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${decompressionProgress || 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Parsing MongoDB entries</span>
          <span className="font-mono text-slate-300">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-brand-400 to-cyan-400 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Real-time stats footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center text-xs">
        <div>
          <span className="text-slate-500 block">Entries Parsed</span>
          <span className="font-mono font-semibold text-slate-200">
            {processedEntries.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Processing Speed</span>
          <span className="font-mono font-semibold text-brand-400 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            {processingSpeedMBps > 0 ? `${processingSpeedMBps} MB/s` : 'Analyzing'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Est. Remaining</span>
          <span className="font-mono font-semibold text-slate-300">
            {estimatedRemainingSeconds > 0 ? `${estimatedRemainingSeconds}s` : '< 1s'}
          </span>
        </div>
      </div>
    </div>
  );
};
