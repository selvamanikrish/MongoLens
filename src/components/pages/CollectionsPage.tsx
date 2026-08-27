import React, { useState, useMemo } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { Database, ArrowUpDown, ChevronRight, Search } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const logResult = useLogStore((state) => state.logResult);
  const setActivePage = useLogStore((state) => state.setActivePage);
  const setFilters = useLogStore((state) => state.setFilters);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'queries' | 'avg' | 'p95' | 'slow' | 'errors' | 'collscan'>('queries');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  if (!logResult) return null;

  const { collections } = logResult;

  const filteredAndSortedCollections = useMemo(() => {
    const list = collections.filter((c) =>
      c.namespace.toLowerCase().includes(search.toLowerCase())
    );

    return list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'queries') diff = b.queriesCount - a.queriesCount;
      else if (sortBy === 'avg') diff = b.avgDuration - a.avgDuration;
      else if (sortBy === 'p95') diff = b.p95Duration - a.p95Duration;
      else if (sortBy === 'slow') diff = b.slowQueriesCount - a.slowQueriesCount;
      else if (sortBy === 'errors') diff = b.errorsCount - a.errorsCount;
      else if (sortBy === 'collscan') diff = b.collscanCount - a.collscanCount;
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [collections, search, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const selectNamespace = (ns: string) => {
    setFilters({ selectedNamespace: ns });
    setActivePage('slow-queries');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Collections & Namespaces Analytics</span>
            <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-500/30">
              {collections.length} namespaces
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Collection-level latency breakdowns, unindexed scans, and throughput hotspots
          </p>
        </div>

        {/* Collection Search Box */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="w-full bg-slate-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Collections Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#090d16] border-b border-white/10 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4 font-semibold">Namespace</th>
                <th
                  onClick={() => handleSort('queries')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Queries</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Avg Latency</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('p95')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>P95 Latency</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('slow')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Slow Queries</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('collscan')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>COLLSCANs</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('errors')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Errors</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredAndSortedCollections.map((col) => (
                <tr
                  key={col.namespace}
                  onClick={() => selectNamespace(col.namespace)}
                  className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  {/* Namespace */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100 group-hover:text-brand-300">
                      {col.namespace}
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      DB: {col.database} • Coll: {col.collection}
                    </div>
                  </td>

                  {/* Queries */}
                  <td className="py-3.5 px-4 text-slate-200">
                    {col.queriesCount.toLocaleString()}
                  </td>

                  {/* Avg Duration */}
                  <td className="py-3.5 px-4 text-brand-400 font-medium">
                    {col.avgDuration} ms
                  </td>

                  {/* P95 Duration */}
                  <td className="py-3.5 px-4 text-orange-400 font-medium">
                    {col.p95Duration} ms
                  </td>

                  {/* Slow Queries */}
                  <td className="py-3.5 px-4">
                    {col.slowQueriesCount > 0 ? (
                      <span className="badge-slow px-2 py-0.5 rounded text-[11px] font-bold">
                        {col.slowQueriesCount}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>

                  {/* COLLSCANs */}
                  <td className="py-3.5 px-4">
                    {col.collscanCount > 0 ? (
                      <span className="badge-collscan px-2 py-0.5 rounded text-[11px] font-bold">
                        {col.collscanCount}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>

                  {/* Errors */}
                  <td className="py-3.5 px-4">
                    {col.errorsCount > 0 ? (
                      <span className="badge-error px-2 py-0.5 rounded text-[11px] font-bold">
                        {col.errorsCount}
                      </span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-[11px] text-slate-400 group-hover:text-brand-400 font-sans inline-flex items-center gap-0.5">
                      Analyze <ChevronRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
