import type { ActionStatus } from '../../../types/common.types';

export type HistoryItem = {
  id: string;
  scheduleId: string;
  scheduleTitle: string;
  scheduledAt: string;
  status: ActionStatus;
  isActionable?: boolean;
  actionedAt?: string;
};
