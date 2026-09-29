import type { RepeatType } from '../../../types/common.types';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type CustomRepeatType = 'specific_days' | 'every_other_day';

export type RepeatRule = {
  type: RepeatType;
  customRepeatType?: CustomRepeatType;
  customDays?: string[];
};

export type Schedule = {
  id: string;
  title: string;
  dose: number;
  time: string;
  startDate: string;
  repeat: RepeatRule;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateScheduleInput = {
  title: string;
  dose: number;
  time: string; // Stored as HH:mm
  startDate: string;
  repeat: {
    type: RepeatType;
    customRepeatType?: CustomRepeatType;
    customDays?: string[];
  };
  isActive: boolean;
};
