import type { RepeatType } from '../../../types/common.types';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RepeatRule = {
  type: RepeatType;
  days?: Weekday[];
};

export type Schedule = {
  id: string;
  title: string;
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
    customDays?: string[];
  };
  isActive: boolean;
};
