import React from 'react';
import { useLogStore } from '../../store/useLogStore';
import { X, Keyboard } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const isOpen = useLogStore((state) => state.isShortcutsOpen);
  const setIsOpen = useLogStore((state) => state.setShortcutsOpen);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl / ⌘ + K', desc: 'Open Command Palette & Global Search' },
    { key: 'Ctrl / ⌘ + O', desc: 'Open new MongoDB log file' },
    { key: 'G then O', desc: 'Jump to Overview Dashboard' },
    { key: 'G then S', desc: 'Jump to Slow Queries' },
    { key: 'G then P', desc: 'Jump to Operations Breakdown' },
    { key: 'G then C', desc: 'Jump to Collections Analytics' },
    { key: 'G then E', desc: 'Jump to Errors & Exceptions' },
    { key: 'G then T', desc: 'Jump to Event Timeline' },
    { key: 'G then R', desc: 'Jump to Raw Logs Console' },
    { key: 'Esc', desc: 'Close Query Detail Drawer or Active Modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0d1424] border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#090d16]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/10 text-brand-300 font-mono font-medium text-[11px] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#090d16] border-t border-white/5 text-center text-xs text-slate-500">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px]">Esc</kbd> anytime to dismiss
        </div>
      </div>
    </div>
  );
};
