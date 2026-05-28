import { useState, useCallback } from 'react';

export function useFilters() {
  const [filters, setFilters] = useState({
    q: '',
    severity: null,
    status: null,
    source: null,
    framework: null,
    owner: null,
    asset_id: null,
  });

  // Wrap applyFilters in useCallback to prevent unnecessary re-renders in components using useMemo
  const applyFilters = useCallback((findings: any[]) => {
    return findings.filter(f => {
      // Text search
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const matches = (f.title && f.title.toLowerCase().includes(q)) || 
                       (f.description && f.description.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Enum filters
      if (filters.severity && f.severity !== filters.severity) return false;
      if (filters.status && f.status !== filters.status) return false;
      if (filters.asset_id && f.asset_id !== filters.asset_id) return false;
      if (filters.owner && f.owner !== filters.owner) return false;
      if (filters.framework && f.control_framework !== filters.framework) return false;

      // Source doc filename
      if (filters.source && f.source_document?.filename !== filters.source) return false;

      return true;
    });
  }, [filters]);

  return { filters, setFilters, applyFilters };
}
