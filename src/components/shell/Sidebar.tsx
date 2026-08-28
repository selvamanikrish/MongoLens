import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import type { ActivePage } from '../../types';
import {
  LayoutDashboard,
  Gauge,
  Layers,
  Database,
  AlertTriangle,
  Clock,
  Terminal,
  ShieldCheck,
  FileCode,
  RotateCcw,
  Sparkles,
  Mail,
  FileText,
  X,
} from 'lucide-react';

interface NavItem {
  id: ActivePage;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  shortcut: string;
}

export const Sidebar: React.FC = () => {
  const activePage = useLogStore((state) => state.activePage);
  const setActivePage = useLogStore((state) => state.setActivePage);
  const isMobileSidebarOpen = useLogStore((state) => state.isMobileSidebarOpen);
  const setMobileSidebarOpen = useLogStore((state) => state.setMobileSidebarOpen);
  const logResult = useLogStore((state) => state.logResult);
  const fileInfo = useLogStore((state) => state.fileInfo);
  const clearData = useLogStore((state) => state.clearData);
  const loadDemoLog = useLogStore((state) => state.loadDemoLog);
  const setPrivacyOpen = useLogStore((state) => state.setPrivacyOpen);
  const setTermsOpen = useLogStore((state) => state.setTermsOpen);
  const setContactOpen = useLogStore((state) => state.setContactOpen);

  const slowCount = logResult?.summary.slowQueriesCount || 0;
  const errorCount = logResult?.summary.errorsCount || 0;

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: 'G O' },
    {
      id: 'slow-queries',
      label: 'Slow Queries',
      icon: Gauge,
      badge: slowCount > 0 ? slowCount.toLocaleString() : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      shortcut: 'G S',
    },
    { id: 'operations', label: 'Operations', icon: Layers, shortcut: 'G P' },
    { id: 'collections', label: 'Collections', icon: Database, shortcut: 'G C' },
    {
      id: 'errors',
      label: 'Errors',
      icon: AlertTriangle,
      badge: errorCount > 0 ? errorCount.toLocaleString() : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      shortcut: 'G E',
    },
    { id: 'timeline', label: 'Timeline', icon: Clock, shortcut: 'G T' },
    { id: 'raw-logs', label: 'Raw Logs', icon: Terminal, shortcut: 'G R' },
  ];

  return (
    <aside
      className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-20
        w-72 sm:w-64 max-w-[85vw] lg:max-w-none h-screen
        bg-[#090d14] border-r border-white/10 lg:border-white/5
        flex flex-col justify-between select-none
        transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Brand Header */}
      <div className="overflow-y-auto">
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-700 to-brand-400 p-[1px] shadow-glow-brand flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#090d14] rounded-[7px] flex items-center justify-center">
                <Database className="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white font-mono text-sm">MongoLens</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Log Analyzer</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
            Analytics
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        item.badgeColor || 'bg-white/10 text-slate-300 border-white/15'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-slate-600 group-hover:text-slate-500 hidden sm:inline-block">
                    {item.shortcut}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom File Summary & Actions */}
      <div className="p-3 space-y-2 border-t border-white/5">
        {/* Privacy badge */}
        <div
          onClick={() => setPrivacyOpen(true)}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 cursor-pointer hover:bg-emerald-900/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">100% Local Privacy</span>
          </div>
          <span className="text-[10px] text-emerald-400 underline font-mono">Info</span>
        </div>

        {/* Current file card */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <FileCode className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="font-mono text-slate-200 text-[11px] truncate font-medium" title={fileInfo?.name}>
              {fileInfo?.name || 'mongod.log'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>{fileInfo?.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : 'Memory'}</span>
            <span>{logResult?.summary.totalEntries.toLocaleString() || 0} lines</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={clearData}
            title="Upload another log file"
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs transition-all"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Open File</span>
          </button>
          <button
            onClick={loadDemoLog}
            title="Reload realistic demo dataset"
            className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-white/10 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Legal & Support Links */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5 px-1 font-sans">
          <button
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-slate-300 transition-colors flex items-center gap-0.5"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
            <span>Privacy</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setTermsOpen(true)}
            className="hover:text-slate-300 transition-colors flex items-center gap-0.5"
          >
            <FileText className="w-3 h-3 text-cyan-500/70" />
            <span>Terms</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setContactOpen(true)}
            className="hover:text-brand-300 transition-colors flex items-center gap-0.5"
            title="Support: support.mongolens@gmail.com"
          >
            <Mail className="w-3 h-3 text-brand-400" />
            <span>Support</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
