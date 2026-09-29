import type { CreateScheduleInput, CustomRepeatType, Schedule } from '../types/schedule.types';

type RepeatSummaryInput = Pick<CreateScheduleInput, 'startDate' | 'time'> & {
  repeat: CreateScheduleInput['repeat']['type'];
  customRepeatType?: CustomRepeatType;
  customDays?: string[];
};

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DAY_ALIASES: Record<string, string> = {
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
  sat: 'Saturday',
  saturday: 'Saturday',
  sun: 'Sunday',
  sunday: 'Sunday',
};

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const WEEKEND_NAMES = ['Saturday', 'Sunday'];

const SHORT_DAY_NAMES: Record<string, string> = {
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
};

const JS_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatScheduleTime(time: string): string {
  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteString} ${suffix}`;
}

function formatSummaryTime(time: string): string {
  if (!time) return '';

  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const minute = Number(minuteString);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return '';
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function formatSummaryDate(dateKey: string): string {
  if (!dateKey) return '';

  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return '';

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

function normalizeDayNames(days: string[]): string[] {
  return Array.from(
    new Set(
      days
        .map(day => DAY_ALIASES[day.trim().toLowerCase()] ?? SHORT_DAY_NAMES[day])
        .filter((day): day is string => Boolean(day)),
    ),
  ).sort((left, right) => DAY_NAMES.indexOf(left) - DAY_NAMES.indexOf(right));
}

function joinDayNames(days: string[]): string {
  if (days.length === 0) return '';

  if (days.length === 1) return days[0];
  if (days.length === 2) return `${days[0]} and ${days[1]}`;
  return `${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}`;
}

function formatDayPattern(days: string[], timeSuffix: string): string {
  const normalizedDays = normalizeDayNames(days);

  if (normalizedDays.length === DAY_NAMES.length) {
    return `Every day${timeSuffix}`;
  }

  if (normalizedDays.join('|') === WEEKDAY_NAMES.join('|')) {
    return `Every weekday${timeSuffix}`;
  }

  if (normalizedDays.join('|') === WEEKEND_NAMES.join('|')) {
    return `Every weekend${timeSuffix}`;
  }

  const dayList = joinDayNames(normalizedDays);
  return dayList ? `Every ${dayList}${timeSuffix}` : '';
}

export function getRepeatSummary(input: RepeatSummaryInput): string {
  const time = formatSummaryTime(input.time);
  const timeSuffix = time ? ` at ${time}` : '';

  if (input.repeat === 'once') {
    const date = formatSummaryDate(input.startDate);
    if (!date && !time) return 'Select a date';
    return `Once${date ? ` on ${date}` : ''}${timeSuffix}`;
  }

  if (input.repeat === 'daily') return `Every day${timeSuffix}`;

  if (input.repeat === 'weekly') {
    const [year, month, day] = input.startDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = year && month && day && !Number.isNaN(date.getTime())
      ? JS_DAY_NAMES[date.getDay()]
      : '';
    return `Every${weekday ? ` ${weekday}` : ' week'}${timeSuffix}`;
  }

  if (input.customRepeatType === 'every_other_day') {
    return `Every other day${timeSuffix}`;
  }

  return formatDayPattern(input.customDays ?? [], timeSuffix) ||
    (time ? `Select at least one day${timeSuffix}` : 'Select at least one day');
}

export function formatRepeat(schedule: Schedule): string {
  if (schedule.repeat.type === 'once') return `Once · ${schedule.startDate}`;
  if (schedule.repeat.type === 'daily') return 'Every day';
  if (
    schedule.repeat.type === 'custom' &&
    schedule.repeat.customRepeatType === 'every_other_day'
  ) {
    return 'Every other day';
  }
  if (schedule.repeat.type === 'custom') {
    return `Specific days · ${schedule.repeat.customDays?.join(', ') ?? ''}`;
  }
  return 'Every week';
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isEveryOtherDayOccurrence(
  startDate: string,
  occurrenceDate: string,
): boolean {
  const difference =
    (parseDateKey(occurrenceDate).getTime() - parseDateKey(startDate).getTime()) /
    (24 * 60 * 60 * 1000);

  return difference >= 0 && difference % 2 === 0;
}

export function getNextEveryOtherDayDate(date: string): string {
  const nextDate = parseDateKey(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + 2);
  return formatDateKey(nextDate);
}
