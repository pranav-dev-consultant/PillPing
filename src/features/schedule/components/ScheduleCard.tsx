import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ActionStatus } from '../../../types/common.types';
import type { Schedule } from '../types/schedule.types';
import type { ScheduleOccurrence } from '../utils/scheduleUtils';
import { formatRepeat, formatScheduleTime } from '../utils/scheduleUtils';
import type { ReminderOccurrenceAction } from '../../../services/notifications/notificationService';
import { useTheme } from '../../../theme/ThemeProvider';

export type ScheduleCardOccurrence = ScheduleOccurrence & {
  status?: ActionStatus;
  upcoming?: boolean;
};

type Props = {
  schedule: Schedule;
  occurrences: ScheduleCardOccurrence[];
  now: Date;
  focusedOccurrenceId?: string;
  onPress: () => void;
  onDelete: () => void;
  onOccurrenceAction: (occurrence: ScheduleOccurrence, action: ReminderOccurrenceAction) => void;
};

export function ScheduleCard({
  schedule,
  occurrences,
  now,
  focusedOccurrenceId,
  onPress,
  onDelete,
  onOccurrenceAction,
}: Props) {
  const { palette } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.header}>
        <Pressable onPress={onPress} style={styles.content}>
          <Text style={[styles.title, { color: palette.text }]}>{schedule.title}</Text>
          <Text style={[styles.dose, { color: palette.muted }]}>{schedule.dose} {schedule.dose === 1 ? 'dose' : 'doses'}</Text>
          <Text style={[styles.repeat, { color: palette.muted }]}>{formatRepeat(schedule)}</Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={12}>
          <Text style={[styles.delete, { color: palette.danger }]}>Delete</Text>
        </Pressable>
      </View>
      {occurrences.map(occurrence => {
        const isDue = !occurrence.upcoming && occurrence.scheduledAt.getTime() <= now.getTime();
        const isFocused = occurrence.occurrenceId === focusedOccurrenceId;
        const statusLabel = occurrence.status
          ? occurrence.status[0].toUpperCase() + occurrence.status.slice(1)
          : undefined;

        return (
          <View
            key={occurrence.occurrenceId || occurrence.time}
            style={[styles.occurrence, { borderTopColor: palette.border }, isFocused && { borderColor: palette.primary, backgroundColor: palette.background }]}
          >
            <Text style={[styles.time, { color: palette.primary }]}>
              {formatScheduleTime(occurrence.time)}
            </Text>
            {statusLabel ? (
              <Text style={[styles.status, { color: occurrence.status === 'taken' ? palette.success : occurrence.status === 'snoozed' ? palette.warning : occurrence.status === 'skipped' ? palette.danger : palette.muted }]}>
                {occurrence.status === 'taken' ? '✓ ' : ''}{statusLabel}
              </Text>
            ) : isDue ? (
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" disabled={!occurrence.occurrenceId} onPress={() => onOccurrenceAction(occurrence, 'taken')} style={[styles.actionButton, { backgroundColor: palette.success }]}>
                  <Text style={styles.actionText}>Taken</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={!occurrence.occurrenceId} onPress={() => onOccurrenceAction(occurrence, 'snoozed')} style={[styles.actionButton, { backgroundColor: palette.warning }]}>
                  <Text style={styles.actionText}>Snooze</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={!occurrence.occurrenceId} onPress={() => onOccurrenceAction(occurrence, 'skipped')} style={[styles.actionButton, { backgroundColor: palette.danger }]}>
                  <Text style={styles.actionText}>Skipped</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.upcoming, { color: palette.muted }]}>Upcoming</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  content: { flex: 1 },
  title: { fontSize: 17, fontWeight: '600', color: '#111827' },
  dose: { marginTop: 4 },
  repeat: { marginTop: 4, color: '#6B7280' },
  occurrence: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E6E8EC', marginTop: 10, paddingTop: 10, paddingHorizontal: 6, paddingBottom: 2, borderRadius: 6 },
  time: { minWidth: 88, fontSize: 16, fontWeight: '700', color: '#2563EB' },
  upcoming: { marginLeft: 'auto', fontSize: 13 },
  status: { marginLeft: 'auto', fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginLeft: 'auto' },
  actionButton: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 6 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  delete: { color: '#DC2626', fontWeight: '600', paddingLeft: 12 },
});
