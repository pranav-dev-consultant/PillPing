import type { CreateScheduleInput, Schedule } from '../types/schedule.types';
import { STORAGE_KEYS, getStoredValue, setStoredValue } from '../../../services/storage/storageService';
// import { cancelScheduledNotification, scheduleLocalNotification } from '../../../services/notifications/notificationService';

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

  // await scheduleLocalNotification({
  //   notificationId: `schedule-${schedule.id}`,
  //   scheduleId: schedule.id,
  //   title: schedule.title,
  //   time: schedule.time,
  //   repeatType: schedule.repeat.type,
  // });

  return schedule;
}

export async function deleteSchedule(schedule: Schedule): Promise<void> {
  const schedules = await getSchedules();
  const next = schedules.filter(item => item.id !== schedule.id);
  await setStoredValue(STORAGE_KEYS.schedules, next);
  // await cancelScheduledNotification(`schedule-${schedule.id}`);
}
