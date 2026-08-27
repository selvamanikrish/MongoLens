import React, { useState, useEffect, useRef } from 'react';
import { useLogStore } from '../../store/useLogStore';
import {
  Search,
  LayoutDashboard,
  Gauge,
  Layers,
  Database,
  AlertTriangle,
  Clock,
  Terminal,
  Download,
  RotateCcw,
  Sparkles,
  Zap,
  Filter,
  X,
  ShieldCheck,
  FileText,
  Mail,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const isOpen = useLogStore((state) => state.isCommandPaletteOpen);
  const setIsOpen = useLogStore((state) => state.setCommandPaletteOpen);
  const setActivePage = useLogStore((state) => state.setActivePage);
  const setFilters = useLogStore((state) => state.setFilters);
  const resetFilters = useLogStore((state) => state.resetFilters);
  const logResult = useLogStore((state) => state.logResult);
  const clearData = useLogStore((state) => state.clearData);
  const loadDemoLog = useLogStore((state) => state.loadDemoLog);
  const setExportOpen = useLogStore((state) => state.setExportOpen);
  const setPrivacyOpen = useLogStore((state) => state.setPrivacyOpen);
  const setTermsOpen = useLogStore((state) => state.setTermsOpen);
  const setContactOpen = useLogStore((state) => state.setContactOpen);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  interface CommandItem {
    id: string;
    label: string;
    sublabel?: string;
    icon: React.ElementType;
    category: 'Navigation' | 'Filters' | 'Namespaces' | 'Actions' | 'Legal & Support';
    action: () => void;
  }

  const items: CommandItem[] = [
    // Navigation
    {
      id: 'nav-overview',
      label: 'Go to Overview Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => {
        setActivePage('overview');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-slow',
      label: 'Go to Slow Queries',
      category: 'Navigation',
      icon: Gauge,
      action: () => {
        setActivePage('slow-queries');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-ops',
      label: 'Go to Operations Breakdown',
      category: 'Navigation',
      icon: Layers,
      action: () => {
        setActivePage('operations');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-colls',
      label: 'Go to Collections Analytics',
      category: 'Navigation',
      icon: Database,
      action: () => {
        setActivePage('collections');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-errors',
      label: 'Go to Errors & Exceptions Hub',
      category: 'Navigation',
      icon: AlertTriangle,
      action: () => {
        setActivePage('errors');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-timeline',
      label: 'Go to Event Timeline',
      category: 'Navigation',
      icon: Clock,
      action: () => {
        setActivePage('timeline');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-raw',
      label: 'Go to Raw Logs Virtual Console',
      category: 'Navigation',
      icon: Terminal,
      action: () => {
        setActivePage('raw-logs');
        setIsOpen(false);
      },
    },

    // Quick Filters
    {
      id: 'filter-collscan',
      label: 'Filter by COLLSCAN (Full Table Scans)',
      sublabel: 'plan:COLLSCAN',
      category: 'Filters',
      icon: Zap,
      action: () => {
        setFilters({ selectedPlan: 'COLLSCAN' });
        setActivePage('slow-queries');
        setIsOpen(false);
      },
    },
    {
      id: 'filter-gt500',
      label: 'Filter queries > 500ms latency',
      sublabel: 'duration:>500',
      category: 'Filters',
      icon: Filter,
      action: () => {
        setFilters({ minDurationMs: 500 });
        setActivePage('slow-queries');
        setIsOpen(false);
      },
    },
    {
      id: 'filter-errors',
      label: 'Filter only Error events',
      sublabel: 'onlyErrors:true',
      category: 'Filters',
      icon: AlertTriangle,
      action: () => {
        setFilters({ onlyErrors: true });
        setActivePage('errors');
        setIsOpen(false);
      },
    },
    {
      id: 'filter-reset',
      label: 'Reset all active filters',
      category: 'Filters',
      icon: X,
      action: () => {
        resetFilters();
        setIsOpen(false);
      },
    },

    // Actions
    {
      id: 'action-export',
      label: 'Export Logs & Diagnostic Reports...',
      category: 'Actions',
      icon: Download,
      action: () => {
        setIsOpen(false);
        setExportOpen(true);
      },
    },
    {
      id: 'action-demo',
      label: 'Load Realistic MongoDB Demo Log',
      category: 'Actions',
      icon: Sparkles,
      action: () => {
        loadDemoLog();
        setIsOpen(false);
      },
    },
    {
      id: 'action-open',
      label: 'Open Another Log File...',
      category: 'Actions',
      icon: RotateCcw,
      action: () => {
        clearData();
        setIsOpen(false);
      },
    },

    // Legal & Support
    {
      id: 'legal-privacy',
      label: 'Privacy Policy (100% Client-Side Engine)',
      sublabel: 'No logs uploaded to remote servers',
      category: 'Legal & Support',
      icon: ShieldCheck,
      action: () => {
        setIsOpen(false);
        setPrivacyOpen(true);
      },
    },
    {
      id: 'legal-terms',
      label: 'Terms & Conditions',
      sublabel: 'Developer use & heuristics disclaimer',
      category: 'Legal & Support',
      icon: FileText,
      action: () => {
        setIsOpen(false);
        setTermsOpen(true);
      },
    },
    {
      id: 'legal-contact',
      label: 'Contact Support (support.mongolens@gmail.com)',
      sublabel: 'Technical help, bug reports & feedback',
      category: 'Legal & Support',
      icon: Mail,
      action: () => {
        setIsOpen(false);
        setContactOpen(true);
      },
    },
  ];

  // Add top namespaces dynamically if parsed
  if (logResult && logResult.collections.length > 0) {
    logResult.collections.slice(0, 6).forEach((col) => {
      items.push({
        id: `ns-${col.namespace}`,
        label: `Filter by namespace: ${col.namespace}`,
        sublabel: `${col.queriesCount} operations • avg ${col.avgDuration}ms`,
        category: 'Namespaces',
        icon: Database,
        action: () => {
          setFilters({ selectedNamespace: col.namespace });
          setActivePage('slow-queries');
          setIsOpen(false);
        },
      });
    });
  }

  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.sublabel && item.sublabel.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      } else if (query.trim()) {
        setFilters({ searchQuery: query.trim() });
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#0d1424] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0a0f1d]">
          <Search className="w-5 h-5 text-brand-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search query, or namespace..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-white/5 max-h-[420px]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching commands or actions found for "{query}".
              <br />
              <button
                onClick={() => {
                  setFilters({ searchQuery: query.trim() });
                  setIsOpen(false);
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-300 font-mono text-xs border border-brand-500/30"
              >
                Apply as Global Search: "{query}"
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-brand-500/15 text-brand-200 border border-brand-500/30'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center ${
                        isSelected ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">{item.label}</div>
                      {item.sublabel && (
                        <div className="text-[11px] font-mono text-slate-500">{item.sublabel}</div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-[#090d16] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↵</kbd> Select
            </span>
          </div>
          <span>MongoLens Command Palette</span>
        </div>
      </div>
    </div>
  );
};
