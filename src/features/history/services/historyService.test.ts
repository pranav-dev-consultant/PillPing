const mockStorage = new Map<string, unknown>();

jest.mock('../../../services/storage/storageService', () => ({
  STORAGE_KEYS: { history: 'history', historyClearedAt: 'historyClearedAt' },
  getStoredValue: async (key: string, fallback: unknown) =>
    mockStorage.has(key) ? mockStorage.get(key) : fallback,
  setStoredValue: async (key: string, value: unknown) => {
    mockStorage.set(key, value);
  },
  removeStoredValue: async (key: string) => {
    mockStorage.delete(key);
  },
}));

import {
  getHistory,
  reactivateSnoozedOccurrence,
  upsertHistoryItemForOccurrence,
} from './historyService';

const occurrence = {
  occurrenceId: 'schedule-123:2026-09-30:13:00',
  scheduleId: 'schedule-123',
  scheduleTitle: 'Paracetamol',
  scheduledAt: '2026-09-30T13:00:00.000Z',
};

describe('snoozed occurrence lifecycle', () => {
  beforeEach(() => mockStorage.clear());

  it('reactivates a snoozed occurrence without erasing its history action', async () => {
    await upsertHistoryItemForOccurrence({ ...occurrence, status: 'snoozed' });

    await reactivateSnoozedOccurrence(occurrence.occurrenceId);

    const [item] = await getHistory();
    expect(item.status).toBe('snoozed');
    expect(item.isActionable).toBe(true);
  });

  it('supports repeated snoozes and replaces them with one final outcome', async () => {
    for (let snoozeCount = 0; snoozeCount < 3; snoozeCount += 1) {
      await upsertHistoryItemForOccurrence({ ...occurrence, status: 'snoozed' });
      await reactivateSnoozedOccurrence(occurrence.occurrenceId);
    }
    await upsertHistoryItemForOccurrence({ ...occurrence, status: 'taken' });

    const history = await getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe('taken');
    expect(history[0].isActionable).toBe(false);
  });

  it('does not reactivate a final skipped occurrence', async () => {
    await upsertHistoryItemForOccurrence({ ...occurrence, status: 'skipped' });

    await reactivateSnoozedOccurrence(occurrence.occurrenceId);

    const [item] = await getHistory();
    expect(item.status).toBe('skipped');
    expect(item.isActionable).toBe(false);
  });

  it('reactivates only the matching medicine and calendar-day occurrence', async () => {
    const otherOccurrences = [
      {
        ...occurrence,
        occurrenceId: 'schedule-456:2026-09-30:13:05',
        scheduleId: 'schedule-456',
        scheduleTitle: 'Vitamin D',
      },
      {
        ...occurrence,
        occurrenceId: 'schedule-123:2026-10-01:13:00',
        scheduledAt: '2026-10-01T13:00:00.000Z',
      },
    ];
    await upsertHistoryItemForOccurrence({ ...occurrence, status: 'snoozed' });
    for (const otherOccurrence of otherOccurrences) {
      await upsertHistoryItemForOccurrence({ ...otherOccurrence, status: 'snoozed' });
    }

    await reactivateSnoozedOccurrence(occurrence.occurrenceId);

    const stateByOccurrence = new Map(
      (await getHistory()).map(item => [item.id, item.isActionable]),
    );
    expect(stateByOccurrence.get(`occurrence-${encodeURIComponent(occurrence.occurrenceId)}`)).toBe(true);
    for (const otherOccurrence of otherOccurrences) {
      expect(stateByOccurrence.get(`occurrence-${encodeURIComponent(otherOccurrence.occurrenceId)}`)).toBe(false);
    }
  });
});