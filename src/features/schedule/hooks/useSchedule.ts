import { useCallback, useEffect, useState } from 'react';

import type { CreateScheduleInput, Schedule } from '../types/schedule.types';
import {
  createSchedule,
  deleteSchedule,
  getSchedules,
  updateSchedule,
} from '../services/scheduleService';

export function useSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSchedules(await getSchedules());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addSchedule = useCallback(async (input: CreateScheduleInput) => {
    await createSchedule(input);
    await refresh();
  }, [refresh]);

  const editSchedule = useCallback(async (scheduleId: string, input: CreateScheduleInput) => {
    await updateSchedule(scheduleId, input);
    await refresh();
  }, [refresh]);

  const removeSchedule = useCallback(async (schedule: Schedule) => {
    await deleteSchedule(schedule);
    await refresh();
  }, [refresh]);

  return { schedules, loading, refresh, addSchedule, editSchedule, removeSchedule };
}
