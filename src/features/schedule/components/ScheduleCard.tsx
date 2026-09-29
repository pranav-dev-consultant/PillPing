import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Schedule } from '../types/schedule.types';
import { formatRepeat, formatScheduleTime } from '../utils/scheduleUtils';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = {
  schedule: Schedule;
  onPress: () => void;
  onDelete: () => void;
};

export function ScheduleCard({ schedule, onPress, onDelete }: Props) {
  const { palette } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Pressable onPress={onPress} style={styles.content}>
        <Text style={[styles.title, { color: palette.text }]}>{schedule.title}</Text>
        <Text style={[styles.time, { color: palette.primary }]}>{formatScheduleTime(schedule.time)}</Text>
        <Text style={[styles.repeat, { color: palette.muted }]}>{formatRepeat(schedule)}</Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={12}>
        <Text style={[styles.delete, { color: palette.danger }]}>Delete</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  content: { flex: 1 },
  title: { fontSize: 17, fontWeight: '600', color: '#111827' },
  time: { marginTop: 6, fontSize: 26, fontWeight: '700', color: '#2563EB' },
  repeat: { marginTop: 4, color: '#6B7280' },
  delete: { color: '#DC2626', fontWeight: '600', paddingLeft: 12 },
});
