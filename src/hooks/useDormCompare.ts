'use client';

import { useState, useCallback, useEffect } from 'react';

const MAX_COMPARE_LIMIT = 4;

export interface UseDormCompareReturn {
  selectedIds: number[];
  count: number;
  isCompared: (id: number) => boolean;
  toggleCompare: (id: number, name?: string) => boolean;
  removeCompare: (id: number) => void;
  clearAllCompare: () => void;
  limitWarning: string | null;
  clearLimitWarning: () => void;
}

export function useDormCompare(): UseDormCompareReturn {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Auto-dismiss limit warning after 4 seconds
  useEffect(() => {
    if (!limitWarning) return;
    const timer = setTimeout(() => {
      setLimitWarning(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [limitWarning]);

  const isCompared = useCallback(
    (id: number) => selectedIds.includes(id),
    [selectedIds]
  );

  const toggleCompare = useCallback(
    (id: number, name?: string): boolean => {
      let added = false;
      setSelectedIds((prev) => {
        if (prev.includes(id)) {
          // Remove from compare list
          return prev.filter((item) => item !== id);
        }

        if (prev.length >= MAX_COMPARE_LIMIT) {
          // Reached limit
          setLimitWarning('เลือกเปรียบเทียบได้สูงสุด 4 หอพัก');
          return prev;
        }

        // Add to compare list
        added = true;
        setLimitWarning(null);
        return [...prev, id];
      });
      return added;
    },
    []
  );

  const removeCompare = useCallback((id: number) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const clearAllCompare = useCallback(() => {
    setSelectedIds([]);
    setLimitWarning(null);
  }, []);

  const clearLimitWarning = useCallback(() => {
    setLimitWarning(null);
  }, []);

  return {
    selectedIds,
    count: selectedIds.length,
    isCompared,
    toggleCompare,
    removeCompare,
    clearAllCompare,
    limitWarning,
    clearLimitWarning,
  };
}
