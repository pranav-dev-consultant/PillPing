import type { Schedule } from '../types/schedule.types';

export function formatScheduleTime(time: string): string {
  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteString} ${suffix}`;
}

export function formatRepeat(schedule: Schedule): string {
  if (schedule.repeat.type === 'once') return `Once · ${schedule.startDate}`;
  if (schedule.repeat.type === 'daily') return 'Every day';
  return 'Every week';
}
