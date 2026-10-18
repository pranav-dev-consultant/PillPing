import type { AlarmToneId, AlarmToneSelection } from '../../../services/notifications/alarmTones';

export type UserAccount = {
  id: string;
  name: string;
  createdAt: string;
  profileImageUri?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  alarmTone?: AlarmToneId;
  alarmToneSelection?: AlarmToneSelection;
  reminderSound?: ReminderSound;
  snoozeDurationMinutes?: number;
  appearance?: AppearancePreference;
};

export type ReminderSound = 'default' | 'silent' | 'notification_tone';
export type AppearancePreference = 'system' | 'light' | 'dark';
