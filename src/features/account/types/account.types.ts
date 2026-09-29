export type UserAccount = {
  id: string;
  name: string;
  createdAt: string;
  profileImageUri?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  reminderSound?: ReminderSound;
  snoozeDurationMinutes?: number;
  appearance?: AppearancePreference;
};

export type ReminderSound = 'default' | 'silent';
export type AppearancePreference = 'system' | 'light' | 'dark';
