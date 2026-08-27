import { useMemo } from 'react';
import { useLogStore } from '../store/useLogStore';
import type { LogEntry } from '../types';

export function useFilteredLogs() {
  const logResult = useLogStore((state) => state.logResult);
  const filters = useLogStore((state) => state.filters);

  const applyFilters = (list: LogEntry[]) => {
    const {
      searchQuery,
      minDurationMs,
      maxDurationMs,
      selectedNamespace,
      selectedOperation,
      selectedSeverity,
      selectedPlan,
      timeRangeFilter,
      onlySlowQueries,
      onlyErrors,
    } = filters;

    const queryTokens = searchQuery.trim().split(/\s+/).filter(Boolean);
    const textTerms: string[] = [];
    const directFilters: Array<(entry: LogEntry) => boolean> = [];

    for (const token of queryTokens) {
      const lower = token.toLowerCase();
      if (lower.startsWith('duration:>') || lower.startsWith('duration:>=')) {
        const val = parseFloat(lower.replace(/duration:>=?/, ''));
        if (!isNaN(val)) directFilters.push((e) => (e.durationMillis || 0) >= val);
      } else if (lower.startsWith('duration:<') || lower.startsWith('duration:<=')) {
        const val = parseFloat(lower.replace(/duration:<=?/, ''));
        if (!isNaN(val)) directFilters.push((e) => (e.durationMillis || 0) <= val);
      } else if (lower.startsWith('duration:')) {
        const val = parseFloat(lower.replace('duration:', ''));
        if (!isNaN(val)) directFilters.push((e) => e.durationMillis === val);
      } else if (lower.startsWith('ns:') || lower.startsWith('namespace:')) {
        const nsVal = lower.replace(/^(ns|namespace):/, '');
        directFilters.push((e) => (e.namespace || '').toLowerCase().includes(nsVal));
      } else if (lower.startsWith('op:') || lower.startsWith('operation:')) {
        const opVal = lower.replace(/^(op|operation):/, '');
        directFilters.push((e) => (e.operation || '').toLowerCase() === opVal);
      } else if (lower.startsWith('plan:')) {
        const planVal = lower.replace('plan:', '');
        directFilters.push((e) => (e.planSummary || '').toLowerCase().includes(planVal));
      } else if (lower.startsWith('severity:') || lower.startsWith('sev:')) {
        const sevVal = lower.replace(/^(severity|sev):/, '').toUpperCase();
        directFilters.push((e) => e.severity === sevVal || (sevVal === 'ERROR' && e.isError));
      } else if (lower === 'error:true' || lower === 'is:error') {
        directFilters.push((e) => e.isError);
      } else if (lower === 'slow:true' || lower === 'is:slow') {
        directFilters.push((e) => e.isSlowQuery);
      } else if (lower.startsWith('code:')) {
        const codeVal = parseInt(lower.replace('code:', ''), 10);
        if (!isNaN(codeVal)) directFilters.push((e) => e.errorCode === codeVal);
      } else {
        textTerms.push(lower);
      }
    }

    return list.filter((entry) => {
      if (minDurationMs > 0 && (entry.durationMillis === undefined || entry.durationMillis < minDurationMs)) {
        return false;
      }
      if (maxDurationMs !== undefined && entry.durationMillis !== undefined && entry.durationMillis > maxDurationMs) {
        return false;
      }
      if (selectedNamespace !== 'ALL' && entry.namespace !== selectedNamespace) {
        return false;
      }
      if (selectedOperation !== 'ALL' && entry.operation !== selectedOperation) {
        return false;
      }
      if (selectedSeverity !== 'ALL') {
        if (selectedSeverity === 'ERROR' && !entry.isError) return false;
        if (selectedSeverity === 'WARN' && !entry.isWarning) return false;
        if (selectedSeverity !== 'ERROR' && selectedSeverity !== 'WARN' && entry.severity !== selectedSeverity) {
          return false;
        }
      }
      if (selectedPlan !== 'ALL') {
        if (!entry.planSummary || !entry.planSummary.toUpperCase().includes(selectedPlan.toUpperCase())) {
          return false;
        }
      }
      if (timeRangeFilter.startMs && entry.parsedDate < timeRangeFilter.startMs) {
        return false;
      }
      if (timeRangeFilter.endMs && entry.parsedDate > timeRangeFilter.endMs) {
        return false;
      }
      if (onlySlowQueries && !entry.isSlowQuery) return false;
      if (onlyErrors && !entry.isError) return false;

      for (const filterFn of directFilters) {
        if (!filterFn(entry)) return false;
      }

      if (textTerms.length > 0) {
        const rawLower = entry.raw.toLowerCase();
        const msgLower = (entry.message || '').toLowerCase();
        const nsLower = (entry.namespace || '').toLowerCase();
        const opLower = (entry.operation || '').toLowerCase();
        const cmdLower = (entry.commandStr || '').toLowerCase();
        const errLower = (entry.error || '').toLowerCase();

        for (const term of textTerms) {
          const match =
            rawLower.includes(term) ||
            msgLower.includes(term) ||
            nsLower.includes(term) ||
            opLower.includes(term) ||
            cmdLower.includes(term) ||
            errLower.includes(term);
          if (!match) return false;
        }
      }

      return true;
    });
  };

  const filteredEntries = useMemo(() => {
    if (!logResult || !logResult.entries) return [];
    return applyFilters(logResult.entries);
  }, [logResult, filters]);

  const filteredSlowQueries = useMemo(() => {
    if (!logResult || !logResult.slowQueries) return [];
    return applyFilters(logResult.slowQueries);
  }, [logResult, filters]);

  const filteredErrors = useMemo(() => {
    return filteredEntries.filter((e) => e.isError);
  }, [filteredEntries]);

  return {
    filteredEntries,
    filteredSlowQueries,
    filteredErrors,
    totalOriginal: logResult?.summary.totalEntries || 0,
    count: filteredEntries.length,
  };
}
