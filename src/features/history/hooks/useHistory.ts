import { useCallback, useEffect, useState } from 'react';

import { clearHistory as clearStoredHistory, getHistory } from '../services/historyService';
import type { HistoryItem } from '../types/history.types';

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getHistory());
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    await clearStoredHistory();
    setItems([]);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh, clearHistory };
}
