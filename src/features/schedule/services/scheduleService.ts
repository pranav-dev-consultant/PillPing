import type { CreateScheduleInput, Schedule } from '../types/schedule.types';
import { STORAGE_KEYS, getStoredValue, setStoredValue } from '../../../services/storage/storageService';
import {
  cancelScheduleNotifications,
  reconcileScheduleNotifications,
} from '../../../services/notifications/notificationService';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getSchedules(): Promise<Schedule[]> {
  const schedules = await getStoredValue<Schedule[]>(STORAGE_KEYS.schedules, []);
  return schedules.sort((a, b) => a.time.localeCompare(b.time));
}

export async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
  const now = new Date().toISOString();
  const schedule: Schedule = {
    ...input,
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
