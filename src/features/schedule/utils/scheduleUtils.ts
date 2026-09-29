import type { CreateScheduleInput, CustomRepeatType, Schedule } from '../types/schedule.types';
import { isValidTime } from '../../../utils/validation';

type RepeatSummaryInput = Pick<CreateScheduleInput, 'startDate'> & {
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

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Sunday: 0,
  Mon: 1,
  Monday: 1,
  Tue: 2,
  Tuesday: 2,
  Wed: 3,
  Wednesday: 3,
  Thu: 4,
  Thursday: 4,
  Fri: 5,
  Friday: 5,
  Sat: 6,
  Saturday: 6,
};

export type ScheduleOccurrence = {
  occurrenceId: string;
  scheduledAt: Date;
  time: string;
};

export function formatScheduleTime(time: string): string {
  const [hourString, minuteString] = time.split(':');
  const hour = Number(hourString);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteString} ${suffix}`;
}

export function normalizeScheduleTimes(schedule: { times?: string[]; time?: string }): string[] {
  const candidates = schedule.times?.length ? schedule.times : schedule.time ? [schedule.time] : [];
  return Array.from(new Set(candidates.filter(isValidTime))).sort();
}

export function normalizeSchedule(schedule: Schedule): Schedule {
  const currentSchedule = { ...schedule };
  delete currentSchedule.time;
  return { ...currentSchedule, times: normalizeScheduleTimes(schedule) };
}

export function getScheduleOccurrencesOnDate(
  schedule: Schedule,
  date: Date,
): ScheduleOccurrence[] {
  if (!schedule.isActive) return [];

  const [startYear, startMonth, startDay] = schedule.startDate.split('-').map(Number);
  const startDate = new Date(startYear, startMonth - 1, startDay);
  const candidateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (
    Number.isNaN(startDate.getTime()) ||
    startDate.getFullYear() !== startYear ||
    startDate.getMonth() !== startMonth - 1 ||
    startDate.getDate() !== startDay ||
    candidateDate < startDate
  ) {
    return [];
  }

  const candidateKey = `${candidateDate.getFullYear()}-${String(candidateDate.getMonth() + 1).padStart(2, '0')}-${String(candidateDate.getDate()).padStart(2, '0')}`;
  const startKey = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const repeat = schedule.repeat;
  const matchesDate = repeat.type === 'once'
    ? candidateKey === startKey
    : repeat.type === 'daily'
      ? true
      : repeat.type === 'weekly'
        ? candidateDate.getDay() === startDate.getDay()
        : repeat.customRepeatType === 'every_other_day'
          ? isEveryOtherDayOccurrence(startKey, candidateKey)
          : (repeat.customDays ?? []).some(day => WEEKDAY_INDEX[day] === candidateDate.getDay());

  if (!matchesDate) return [];

  return normalizeScheduleTimes(schedule).map(time => {
    const [hour, minute] = time.split(':').map(Number);
    const scheduledAt = new Date(candidateDate);
    scheduledAt.setHours(hour, minute, 0, 0);
    return {
      occurrenceId: `${schedule.id}:${candidateKey}:${time}`,
      scheduledAt,
      time,
    };
  });
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
  if (input.repeat === 'once') {
    const date = formatSummaryDate(input.startDate);
    return date ? `Once on ${date}` : 'Select a date';
  }

  if (input.repeat === 'daily') return 'Every day';

  if (input.repeat === 'weekly') {
    const [year, month, day] = input.startDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = year && month && day && !Number.isNaN(date.getTime())
      ? JS_DAY_NAMES[date.getDay()]
      : '';
    return `Every${weekday ? ` ${weekday}` : ' week'}`;
  }

  if (input.customRepeatType === 'every_other_day') {
    return 'Every other day';
  }

  return formatDayPattern(input.customDays ?? [], '') || 'Select at least one day';
}

export function formatRepeat(schedule: Schedule): string {
  return getRepeatSummary({
    repeat: schedule.repeat.type,
    startDate: schedule.startDate,
    customRepeatType: schedule.repeat.customRepeatType,
    customDays: schedule.repeat.customDays,
  });
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
