import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  EventType,
  TriggerType,
  type Event,
  type Notification,
  type TimestampTrigger,
} from '@notifee/react-native';
import { Platform } from 'react-native';

import { upsertHistoryItemForOccurrence } from '../../features/history/services/historyService';
import type { Schedule } from '../../features/schedule/types/schedule.types';
import { isEveryOtherDayOccurrence, formatScheduleTime } from '../../features/schedule/utils/scheduleUtils';
import { STORAGE_KEYS, getStoredValue, setStoredValue } from '../storage/storageService';

const CHANNEL_ID = 'medicine-reminders';
const IOS_CATEGORY_ID = 'medicine-reminder-actions';
const SNOOZE_DURATION_MINUTES = 10;
const MAX_PENDING_NOTIFICATIONS = 40;
const MAX_SNOOZE_NOTIFICATIONS = 10;
const MAX_OCCURRENCES_PER_SCHEDULE = 50;
const SEARCH_DAYS = 370;
const MANAGED_SCHEDULE = 'pillping-schedule';
const MANAGED_SNOOZE = 'pillping-snooze';
const ACTION_OPEN = 'open-schedule';
const ACTION_TAKEN = 'taken';
const ACTION_SKIPPED = 'skipped';
const ACTION_SNOOZE = 'snooze';
type ReminderSound = 'default' | 'silent';
type NotificationPreferences = {
  reminderSound?: ReminderSound;
  snoozeDurationMinutes?: number;
};

function getChannelId(sound: ReminderSound): string {
  return `${CHANNEL_ID}-${sound}`;
}

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

type DoseOccurrence = {
  schedule: Schedule;
  dateKey: string;
  scheduledAt: Date;
  occurrenceId: string;
};

function getString(data: Notification['data'], key: string): string | undefined {
  const value = data?.[key];
  return typeof value === 'string' ? value : undefined;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }

  return parsed;
}

function getScheduleTime(schedule: Schedule): { hour: number; minute: number } | undefined {
  const match = /^(\d{2}):(\d{2})$/.exec(schedule.time);
  if (!match) return undefined;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return undefined;
  return { hour, minute };
}

function matchesScheduleDate(schedule: Schedule, candidate: Date, startDate: Date): boolean {
  const repeat = schedule.repeat;

  if (repeat.type === 'once') {
    return dateKey(candidate) === dateKey(startDate);
  }

  if (repeat.type === 'daily') return true;
  if (repeat.type === 'weekly') return candidate.getDay() === startDate.getDay();

  if (repeat.customRepeatType === 'every_other_day') {
    return isEveryOtherDayOccurrence(schedule.startDate, dateKey(candidate));
  }

  const selectedDays = repeat.customDays ?? [];
  return selectedDays.some(day => WEEKDAY_INDEX[day] === candidate.getDay());
}

function getOccurrences(schedule: Schedule, now: Date): DoseOccurrence[] {
  if (!schedule.isActive) return [];

  const startDate = parseDateKey(schedule.startDate);
  const time = getScheduleTime(schedule);
  if (!startDate || !time) return [];

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidateDate = startDate > today ? new Date(startDate) : today;
  const occurrences: DoseOccurrence[] = [];

  for (
    let dayOffset = 0;
    dayOffset < SEARCH_DAYS && occurrences.length < MAX_OCCURRENCES_PER_SCHEDULE;
    dayOffset += 1
  ) {
    const scheduledAt = new Date(candidateDate);
    scheduledAt.setHours(time.hour, time.minute, 0, 0);

    if (
      scheduledAt.getTime() > now.getTime() &&
      matchesScheduleDate(schedule, candidateDate, startDate)
    ) {
      const occurrenceDate = dateKey(candidateDate);
      occurrences.push({
        schedule,
        dateKey: occurrenceDate,
        scheduledAt,
        occurrenceId: `${schedule.id}:${occurrenceDate}`,
      });
    }

    if (schedule.repeat.type === 'once') break;
    candidateDate.setDate(candidateDate.getDate() + 1);
  }

  return occurrences;
}

function scheduleNotificationId(scheduleId: string, date: string): string {
  return `pillping-dose-${encodeURIComponent(scheduleId)}-${date}`;
}

function snoozeNotificationId(occurrenceId: string): string {
  return `pillping-snooze-${encodeURIComponent(occurrenceId)}`;
}

function timestampTrigger(timestamp: number, useAlarmManager: boolean): TimestampTrigger {
  return {
    type: TriggerType.TIMESTAMP,
    timestamp,
    ...(useAlarmManager
      ? { alarmManager: { type: AlarmType.SET_AND_ALLOW_WHILE_IDLE } }
      : {}),
  };
}

function buildNotification(
  schedule: Schedule,
  occurrenceId: string,
  scheduledAt: Date,
  notificationId: string,
  managedBy: string,
  sound: ReminderSound,
): Notification {
  const doseText = `${schedule.dose} ${schedule.dose === 1 ? 'dose' : 'doses'}`;
  const timeText = formatScheduleTime(schedule.time);

  return {
    id: notificationId,
    title: `💊 Time to take ${schedule.title}`,
    body: `${doseText} • ${timeText}`,
    data: {
      managedBy,
      scheduleId: schedule.id,
      occurrenceId,
      scheduledAt: scheduledAt.toISOString(),
      scheduleTitle: schedule.title,
      dose: String(schedule.dose),
      time: schedule.time,
    },
    android: {
      channelId: getChannelId(sound),
      pressAction: { id: ACTION_OPEN },
      actions: [
        { title: 'Taken', pressAction: { id: ACTION_TAKEN } },
        { title: 'Snooze', pressAction: { id: ACTION_SNOOZE } },
        { title: 'Skipped', pressAction: { id: ACTION_SKIPPED } },
      ],
    },
    ios: {
      categoryId: IOS_CATEGORY_ID,
      ...(sound === 'default' ? { sound: 'default' } : {}),
      foregroundPresentationOptions: {
        banner: true,
        list: true,
        sound: true,
        badge: false,
      },
    },
  };
}

async function configureNotificationPresentation(sound: ReminderSound = 'default'): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: getChannelId(sound),
      name: 'Medicine reminders',
      importance: AndroidImportance.HIGH,
      sound: sound === 'default' ? 'default' : undefined,
      vibration: true,
    });
    return;
  }

  if (Platform.OS === 'ios') {
    await notifee.setNotificationCategories([
      {
        id: IOS_CATEGORY_ID,
        actions: [
          { id: ACTION_TAKEN, title: 'Taken' },
          { id: ACTION_SNOOZE, title: 'Snooze' },
          { id: ACTION_SKIPPED, title: 'Skipped' },
        ],
      },
    ]);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await configureNotificationPresentation();
    const current = await notifee.getNotificationSettings();
    if (
      current.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      current.authorizationStatus === AuthorizationStatus.PROVISIONAL
    ) {
      return true;
    }

    const alreadyAsked = await getStoredValue<boolean>(
      STORAGE_KEYS.notificationPermissionAsked,
      false,
    );
    if (alreadyAsked) return false;

    await setStoredValue(STORAGE_KEYS.notificationPermissionAsked, true);
    const requested = await notifee.requestPermission({
      alert: true,
      badge: true,
      sound: true,
    });

    return (
      requested.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      requested.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('[Notifications] Permission request failed', error);
    return false;
  }
}

async function hasNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('[Notifications] Could not read permission settings', error);
    return false;
  }
}

async function clearManagedScheduleTriggers(scheduleId?: string): Promise<void> {
  const pending = await notifee.getTriggerNotifications();
  const matchingIds = pending
    .filter(({ notification }) => {
      const managedBy = getString(notification.data, 'managedBy');
      const notificationScheduleId = getString(notification.data, 'scheduleId');
      return (
        managedBy === MANAGED_SCHEDULE &&
        (!scheduleId || notificationScheduleId === scheduleId)
      );
    })
    .map(({ notification }) => notification.id)
    .filter((id): id is string => Boolean(id));

  await Promise.all(matchingIds.map(id => notifee.cancelTriggerNotification(id)));
}

async function clearScheduleNotifications(scheduleId: string): Promise<void> {
  const [pending, displayed] = await Promise.all([
    notifee.getTriggerNotifications(),
    notifee.getDisplayedNotifications(),
  ]);
  const ids = new Set<string>();

  pending.forEach(({ notification }) => {
    if (getString(notification.data, 'scheduleId') === scheduleId && notification.id) {
      ids.add(notification.id);
    }
  });
  displayed.forEach(({ notification }) => {
    if (getString(notification.data, 'scheduleId') === scheduleId && notification.id) {
      ids.add(notification.id);
    }
  });

  await Promise.all(Array.from(ids, id => notifee.cancelNotification(id)));
}

export async function reconcileScheduleNotifications(
  options: { requestPermission?: boolean } = {},
): Promise<void> {
  try {
    const preferences = await getStoredValue<NotificationPreferences | null>(
      STORAGE_KEYS.account,
      null,
    );
    const reminderSound = preferences?.reminderSound ?? 'default';
    await configureNotificationPresentation(reminderSound);
    const permitted = options.requestPermission
      ? await requestNotificationPermission()
      : await hasNotificationPermission();
    if (!permitted) return;

    const settings = await notifee.getNotificationSettings();
    const useAlarmManager =
      Platform.OS === 'android' &&
      settings.android.alarm === AndroidNotificationSetting.ENABLED;

    const schedules = await getStoredValue<Schedule[]>(STORAGE_KEYS.schedules, []);
    const now = new Date();
    const occurrences = schedules
      .flatMap(schedule => getOccurrences(schedule, now))
      .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime())
      .slice(0, MAX_PENDING_NOTIFICATIONS);

    await clearManagedScheduleTriggers();

    await Promise.allSettled(
      occurrences.map(occurrence =>
        notifee.createTriggerNotification(
          buildNotification(
            occurrence.schedule,
            occurrence.occurrenceId,
            occurrence.scheduledAt,
            scheduleNotificationId(occurrence.schedule.id, occurrence.dateKey),
            MANAGED_SCHEDULE,
            reminderSound,
          ),
          timestampTrigger(occurrence.scheduledAt.getTime(), useAlarmManager),
        ),
      ),
    ).then(results => {
      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`[Notifications] ${failed.length} reminder(s) could not be scheduled`);
      }
    });
  } catch (error) {
    console.warn('[Notifications] Could not reconcile reminders', error);
  }
}

export async function initializeNotificationService(): Promise<void> {
  try {
    await configureNotificationPresentation();
    if (await hasNotificationPermission()) {
      await reconcileScheduleNotifications();
    }
  } catch (error) {
    console.warn('[Notifications] Initialization failed', error);
  }
}

export async function cancelScheduleNotifications(scheduleId: string): Promise<void> {
  try {
    await clearScheduleNotifications(scheduleId);
  } catch (error) {
    console.warn('[Notifications] Could not cancel schedule reminders', error);
  }
}

export async function cancelMedicationNotifications(): Promise<void> {
  try {
    const [pending, displayed] = await Promise.all([
      notifee.getTriggerNotifications(),
      notifee.getDisplayedNotifications(),
    ]);
    const ids = new Set<string>();

    [...pending, ...displayed].forEach(({ notification }) => {
      const managedBy = getString(notification.data, 'managedBy');
      if (
        (managedBy === MANAGED_SCHEDULE || managedBy === MANAGED_SNOOZE) &&
        notification.id
      ) {
        ids.add(notification.id);
      }
    });

    await Promise.all(Array.from(ids, id => notifee.cancelNotification(id)));
  } catch (error) {
    console.warn('[Notifications] Could not cancel all medication reminders', error);
    throw error;
  }
}

async function recordNotificationAction(
  notification: Notification,
  status: 'taken' | 'skipped' | 'snoozed',
): Promise<void> {
  const data = notification.data;
  const scheduleId = getString(data, 'scheduleId');
  const occurrenceId = getString(data, 'occurrenceId');
  const scheduleTitle = getString(data, 'scheduleTitle') ?? notification.title ?? 'Medicine';
  const scheduledAt = getString(data, 'scheduledAt');

  if (!scheduleId || !occurrenceId || !scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
    return;
  }

  await upsertHistoryItemForOccurrence({
    occurrenceId,
    scheduleId,
    scheduleTitle,
    scheduledAt,
    status,
  });
}

async function snoozeNotification(notification: Notification): Promise<void> {
  const data = notification.data;
  const scheduleId = getString(data, 'scheduleId');
  const occurrenceId = getString(data, 'occurrenceId');
  const scheduleTitle = getString(data, 'scheduleTitle') ?? notification.title ?? 'Medicine';
  const scheduledAtValue = getString(data, 'scheduledAt');
  const dose = getString(data, 'dose') ?? '1';
  const time = getString(data, 'time') ?? '';

  if (!scheduleId || !occurrenceId || !scheduledAtValue) return;
  const scheduledAt = new Date(scheduledAtValue);
  if (Number.isNaN(scheduledAt.getTime())) return;

  const snoozedId = snoozeNotificationId(occurrenceId);
  const pending = await notifee.getTriggerNotifications();
  const snoozeCount = pending.filter(
    ({ notification: pendingNotification }) =>
      getString(pendingNotification.data, 'managedBy') === MANAGED_SNOOZE,
  ).length;
  const alreadyScheduled = pending.some(
    ({ notification: pendingNotification }) => pendingNotification.id === snoozedId,
  );

  if (!alreadyScheduled && snoozeCount >= MAX_SNOOZE_NOTIFICATIONS) {
    console.warn('[Notifications] Snooze limit reached; keeping the original reminder');
    return;
  }

  await recordNotificationAction(notification, 'snoozed');
  if (notification.id) await notifee.cancelNotification(notification.id);

  const preferences = await getStoredValue<NotificationPreferences | null>(
    STORAGE_KEYS.account,
    null,
  );
  const snoozeDuration = preferences?.snoozeDurationMinutes ?? SNOOZE_DURATION_MINUTES;
  const reminderSound = preferences?.reminderSound ?? 'default';
  await configureNotificationPresentation(reminderSound);
  const snoozeAt = Date.now() + snoozeDuration * 60 * 1000;
  const bodyTime = formatScheduleTime(time);
  const snoozed: Notification = {
    id: snoozedId,
    title: `💊 Time to take ${scheduleTitle}`,
    body: `${dose} ${dose === '1' ? 'dose' : 'doses'} • ${bodyTime}`,
    data: {
      ...data,
      managedBy: MANAGED_SNOOZE,
    },
    android: {
      channelId: getChannelId(reminderSound),
      pressAction: { id: ACTION_OPEN },
      actions: [
        { title: 'Taken', pressAction: { id: ACTION_TAKEN } },
        { title: 'Snooze', pressAction: { id: ACTION_SNOOZE } },
        { title: 'Skipped', pressAction: { id: ACTION_SKIPPED } },
      ],
    },
    ios: {
      categoryId: IOS_CATEGORY_ID,
      ...(reminderSound === 'default' ? { sound: 'default' } : {}),
      foregroundPresentationOptions: { banner: true, list: true, sound: true },
    },
  };

  const settings = await notifee.getNotificationSettings();
  const useAlarmManager =
    Platform.OS === 'android' &&
    settings.android.alarm === AndroidNotificationSetting.ENABLED;
  await notifee.createTriggerNotification(
    snoozed,
    timestampTrigger(snoozeAt, useAlarmManager),
  );
}

export async function handleNotificationEvent(event: Event): Promise<boolean> {
  try {
    const notification = event.detail.notification;
    if (!notification) return false;

    if (
      event.type === EventType.DELIVERED &&
      getString(notification.data, 'managedBy') === MANAGED_SCHEDULE
    ) {
      await reconcileScheduleNotifications();
      return false;
    }

    if (event.type === EventType.PRESS) {
      return getString(notification.data, 'scheduleId') !== undefined;
    }

    if (event.type !== EventType.ACTION_PRESS) return false;

    const actionId = event.detail.pressAction?.id;
    if (actionId === ACTION_TAKEN) {
      await recordNotificationAction(notification, 'taken');
      if (notification.id) await notifee.cancelNotification(notification.id);
      const occurrenceId = getString(notification.data, 'occurrenceId');
      if (occurrenceId) await notifee.cancelNotification(snoozeNotificationId(occurrenceId));
    } else if (actionId === ACTION_SKIPPED) {
      await recordNotificationAction(notification, 'skipped');
      if (notification.id) await notifee.cancelNotification(notification.id);
      const occurrenceId = getString(notification.data, 'occurrenceId');
      if (occurrenceId) await notifee.cancelNotification(snoozeNotificationId(occurrenceId));
    } else if (actionId === ACTION_SNOOZE) {
      await snoozeNotification(notification);
    }

    return false;
  } catch (error) {
    console.warn('[Notifications] Could not handle notification event', error);
    return false;
  }
}

export function subscribeToNotificationEvents(onOpenSchedule: () => void): () => void {
  return notifee.onForegroundEvent(event => {
    void handleNotificationEvent(event).then(shouldOpen => {
      if (shouldOpen) onOpenSchedule();
    });
  });
}

export async function getInitialNotificationScheduleId(): Promise<string | undefined> {
  try {
    const initial = await notifee.getInitialNotification();
    return getString(initial?.notification.data, 'scheduleId');
  } catch (error) {
    console.warn('[Notifications] Could not read launch notification', error);
    return undefined;
  }
}