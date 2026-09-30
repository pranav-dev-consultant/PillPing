import type { ActionStatus } from '../../../types/common.types';
import type { HistoryItem } from '../types/history.types';
import {
  STORAGE_KEYS,
  getStoredValue,
  removeStoredValue,
  setStoredValue,
} from '../../../services/storage/storageService';

function createId(): string {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const items = await getStoredValue<HistoryItem[]>(STORAGE_KEYS.history, []);
  return items.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
}

export async function clearHistory(): Promise<void> {
  await setStoredValue(STORAGE_KEYS.historyClearedAt, new Date().toISOString());
  await removeStoredValue(STORAGE_KEYS.history);
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

export async function upsertHistoryItemForOccurrence(input: {
  occurrenceId: string;
  scheduleId: string;
  scheduleTitle: string;
  scheduledAt: string;
  status: ActionStatus;
  isActionable?: boolean;
}): Promise<void> {
  const clearedAt = await getStoredValue<string | null>(STORAGE_KEYS.historyClearedAt, null);
  if (clearedAt && input.scheduledAt <= clearedAt) return;

  const history = await getHistory();
  const item: HistoryItem = {
    id: `occurrence-${encodeURIComponent(input.occurrenceId)}`,
    scheduleId: input.scheduleId,
    scheduleTitle: input.scheduleTitle,
    scheduledAt: input.scheduledAt,
    status: input.status,
    isActionable: input.isActionable ?? false,
    actionedAt: new Date().toISOString(),
  };

  await setStoredValue(
    STORAGE_KEYS.history,
    [item, ...history.filter(existing => existing.id !== item.id)],
  );
}

export async function reactivateSnoozedOccurrence(occurrenceId: string): Promise<void> {
  const history = await getHistory();
  const itemId = `occurrence-${encodeURIComponent(occurrenceId)}`;
  const item = history.find(existing => existing.id === itemId);
  if (!item || item.status !== 'snoozed' || item.isActionable) return;

  await setStoredValue(
    STORAGE_KEYS.history,
    history.map(existing =>
      existing.id === itemId ? { ...existing, isActionable: true } : existing,
    ),
  );
}
