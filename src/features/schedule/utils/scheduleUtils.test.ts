import {
  formatRepeat,
  getScheduleOccurrencesOnDate,
  normalizeSchedule,
  normalizeScheduleTimes,
} from './scheduleUtils';
import type { Schedule } from '../types/schedule.types';

const schedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'schedule-1',
  title: 'Paracetamol',
  dose: 1,
  times: ['08:00'],
  startDate: '2026-09-30',
  repeat: { type: 'daily' },
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

describe('schedule time normalization', () => {
  it('converts a legacy single time into the times array', () => {
    const legacySchedule = { ...schedule(), time: '08:00' } as Schedule;
    Reflect.deleteProperty(legacySchedule, 'times');
    expect(normalizeSchedule(legacySchedule)).toMatchObject({
      times: ['08:00'],
    });
  });

  it('sorts, deduplicates, and ignores invalid times', () => {
    expect(normalizeScheduleTimes({
      times: ['20:00', '08:00', '08:00', '25:00'],
      time: '06:00',
    })).toEqual(['08:00', '20:00']);
  });
});

describe('friendly repeat summary', () => {
  it('renders all selected weekdays as every day', () => {
    expect(formatRepeat(schedule({
      repeat: {
        type: 'custom',
        customDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    }))).toBe('Every day');
  });

  it('renders selected weekdays in a concise sentence', () => {
    expect(formatRepeat(schedule({
      repeat: { type: 'custom', customDays: ['Mon', 'Wed', 'Fri'] },
    }))).toBe('Every Monday, Wednesday and Friday');
  });
});

describe('schedule occurrences', () => {
  it('creates an independent occurrence for every selected time on the date', () => {
    const occurrences = getScheduleOccurrencesOnDate(schedule({
      times: ['08:00', '14:00', '20:00'],
    }), new Date(2026, 8, 30, 15, 0));

    expect(occurrences.map(item => item.occurrenceId)).toEqual([
      'schedule-1:2026-09-30:08:00',
      'schedule-1:2026-09-30:14:00',
      'schedule-1:2026-09-30:20:00',
    ]);
    expect(occurrences.map(item => item.scheduledAt.getHours())).toEqual([8, 14, 20]);
  });

  it('does not create occurrences on dates that do not match the repeat rule', () => {
    expect(getScheduleOccurrencesOnDate(schedule({
      repeat: { type: 'weekly' },
    }), new Date(2026, 9, 1))).toEqual([]);
  });
});