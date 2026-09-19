import type { ActionStatus } from '../../../types/common.types';
import type { HistoryItem } from '../types/history.types';
import { STORAGE_KEYS, getStoredValue, setStoredValue } from '../../../services/storage/storageService';

function createId(): string {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const items = await getStoredValue<HistoryItem[]>(STORAGE_KEYS.history, []);
  return items.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}

export async function addHistoryItemForSchedule(input: {
  scheduleId: string;
  scheduleTitle: string;
  status: ActionStatus;
}): Promise<void> {
  const item: HistoryItem = {
    id: createId(),
    scheduleId: input.scheduleId,
    scheduleTitle: input.scheduleTitle,
    scheduledAt: new Date().toISOString(),
    status: input.status,
    actionedAt: new Date().toISOString(),
  };

  const history = await getHistory();
  await setStoredValue(STORAGE_KEYS.history, [item, ...history]);
}
