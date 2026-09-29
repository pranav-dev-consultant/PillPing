import type { CreateScheduleInput, Schedule } from '../types/schedule.types';
import { STORAGE_KEYS, getStoredValue, setStoredValue } from '../../../services/storage/storageService';
import {
  cancelScheduleNotifications,
  reconcileScheduleNotifications,
} from '../../../services/notifications/notificationService';
import { normalizeSchedule, normalizeScheduleTimes } from '../utils/scheduleUtils';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getSchedules(): Promise<Schedule[]> {
  const storedSchedules = await getStoredValue<Schedule[]>(STORAGE_KEYS.schedules, []);
  const schedules = storedSchedules.map(normalizeSchedule);
  if (storedSchedules.some(schedule => !Array.isArray(schedule.times) || schedule.time !== undefined)) {
    await setStoredValue(STORAGE_KEYS.schedules, schedules);
  }
  return schedules.sort((a, b) => (a.times[0] ?? '').localeCompare(b.times[0] ?? ''));
}

export async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
  const now = new Date().toISOString();
  const schedule: Schedule = {
    ...input,
    times: normalizeScheduleTimes(input),
    id: createId('schedule'),
    createdAt: now,
    updatedAt: now,
  };

  const schedules = await getSchedules();
  await setStoredValue(STORAGE_KEYS.schedules, [...schedules, schedule]);
  await reconcileScheduleNotifications({ requestPermission: true });

  return schedule;
}

export async function updateSchedule(
  scheduleId: string,
  input: CreateScheduleInput,
): Promise<Schedule> {
  const schedules = await getSchedules();
  const existing = schedules.find(schedule => schedule.id === scheduleId);

  if (!existing) {
    throw new Error('Schedule not found');
  }

  const updatedSchedule: Schedule = {
    ...existing,
    ...input,
    times: normalizeScheduleTimes(input),
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  await setStoredValue(
    STORAGE_KEYS.schedules,
    schedules.map(schedule =>
      schedule.id === scheduleId ? updatedSchedule : schedule,
    ),
  );
  await cancelScheduleNotifications(scheduleId);
  await reconcileScheduleNotifications({ requestPermission: true });

  return updatedSchedule;
}

export async function deleteSchedule(schedule: Schedule): Promise<void> {
  const schedules = await getSchedules();
  const next = schedules.filter(item => item.id !== schedule.id);
  await setStoredValue(STORAGE_KEYS.schedules, next);
  await cancelScheduleNotifications(schedule.id);
  await reconcileScheduleNotifications();
}
