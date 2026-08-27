import React, { useState, useRef } from 'react';
import { useLogStore } from '../../store/useLogStore';
import {
  UploadCloud,
  FileCode,
  ShieldCheck,
  Zap,
  Activity,
  Search,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  Mail,
  FileText,
} from 'lucide-react';
import { FileUploadProgress } from './FileUploadProgress';

export const FileDropzone: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isParsing = useLogStore((state) => state.isParsing);
  const parseFile = useLogStore((state) => state.parseFile);
  const loadDemoLog = useLogStore((state) => state.loadDemoLog);
  const setTermsOpen = useLogStore((state) => state.setTermsOpen);
  const setPrivacyOpen = useLogStore((state) => state.setPrivacyOpen);
  const setContactOpen = useLogStore((state) => state.setContactOpen);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      parseFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      parseFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b11] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-brand-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] left-1/4 w-[600px] h-[300px] bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Header Navigation */}
      <header className="px-6 sm:px-8 py-4 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-400 p-[1px] shadow-glow-brand flex items-center justify-center">
            <div className="w-full h-full bg-[#090d14] rounded-[11px] flex items-center justify-center">
              <Database className="w-4 h-4 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white font-mono text-base">MongoLens</span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">MongoDB Log Analyzer</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-400">
          <button
            onClick={() => setPrivacyOpen(true)}
            className="hidden md:flex items-center gap-1 hover:text-white transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy</span>
          </button>

          <button
            onClick={() => setContactOpen(true)}
            className="hidden sm:flex items-center gap-1 hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
          >
            <Mail className="w-3.5 h-3.5 text-brand-400" />
            <span>Support</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 text-emerald-400/90 font-mono bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            100% Local Processing
          </div>

          <button
            onClick={loadDemoLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 transition-all font-medium shadow-glow-brand"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Try Demo</span>
          </button>
        </div>
      </header>

      {/* Main Hero & Upload Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col items-center justify-center relative z-10">
        {isParsing ? (
          <FileUploadProgress />
        ) : (
          <div className="w-full flex flex-col items-center text-center animate-fade-in">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-medium mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>See what's slowing MongoDB down.</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
              Inspect & Analyze MongoDB Logs <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                Entirely in Your Browser
              </span>
            </h1>

            <p className="text-slate-400 max-w-2xl text-sm sm:text-base mb-8 leading-relaxed">
              Drop your <code className="text-slate-200 bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">mongod.log</code> or{' '}
              <code className="text-slate-200 bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">mongod.log.gz</code> to instantly
              diagnose slow queries, collection scans (<span className="text-amber-400 font-mono">COLLSCAN</span>), command latencies, and error spikes with zero server upload.
            </p>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-2xl p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center relative bg-gradient-to-b from-[#0f172a]/90 to-[#0c1322]/90 backdrop-blur-md shadow-2xl ${
                isDragging
                  ? 'border-brand-400 bg-brand-500/10 scale-[1.01] shadow-glow-brand'
                  : 'border-white/15 hover:border-brand-500/50 hover:bg-[#121c32]/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".log,.txt,.gz,.zip"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all duration-200 shadow-glow-brand">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors">
                Drop MongoDB logs here
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                or <span className="text-brand-400 underline underline-offset-4 font-medium">browse from your computer</span>
              </p>

              {/* Supported formats pills */}
              <div className="flex items-center gap-2">
                {['.log', '.txt', '.gz', '.zip'].map((ext) => (
                  <span
                    key={ext}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/5 border border-white/10 text-slate-300 group-hover:border-brand-500/30 transition-colors"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick action buttons & Demo loader */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <button
                onClick={loadDemoLog}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-slate-950 font-semibold text-xs transition-all shadow-glow-brand active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Load Realistic Demo Log
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Privacy & Feature Guarantees */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full mt-8 pt-6 border-t border-white/5 text-xs text-slate-400">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Runs 100% locally</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <FileCode className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Auto GZIP Stream</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Web Worker Turbo</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>No Network Upload</span>
              </div>
            </div>
          </div>
        )}

        {/* Feature Preview Cards */}
        {!isParsing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mt-12">
            <div className="p-4 rounded-xl glass-panel border border-white/5 hover:border-white/10 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">Slow Query & Plan Diagnostics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detect unindexed <code className="text-amber-300 font-mono text-[11px]">COLLSCAN</code>, in-memory sorts, and examine vs returned document ratios instantly.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/5 hover:border-white/10 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                <Search className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">Intelligent ESR Index Analyzer</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get automated index suggestions following Equality-Sort-Range heuristics with ready-to-use <code className="text-brand-300 font-mono text-[11px]">createIndex()</code> snippets.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-panel border border-white/5 hover:border-white/10 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <FileCode className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">60 FPS Virtualized Log Console</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect 100,000+ raw entries seamlessly with syntax highlighting, search jumping, and zero browser freeze.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Comprehensive Footer with Legal & Contact */}
      <footer className="px-8 py-5 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 relative z-10 gap-3">
        <div>
          <span>MongoLens • Modern Browser-Based MongoDB Diagnostic Tool</span>
          <span className="hidden sm:inline mx-2">•</span>
          <span className="text-slate-400">100% Client-Side Privacy</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-brand-300 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setTermsOpen(true)}
            className="hover:text-brand-300 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Terms & Conditions</span>
          </button>

          <button
            onClick={() => setContactOpen(true)}
            className="hover:text-brand-300 transition-colors flex items-center gap-1 text-slate-300"
          >
            <Mail className="w-3.5 h-3.5 text-brand-400" />
            <span>Contact (support.mongolens@gmail.com)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
