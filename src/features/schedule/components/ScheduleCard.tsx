import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Schedule } from '../types/schedule.types';
import { formatRepeat, formatScheduleTime } from '../utils/scheduleUtils';

type Props = {
  schedule: Schedule;
  onDelete: () => void;
};

export function ScheduleCard({ schedule, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title}>{schedule.title}</Text>
        <Text style={styles.time}>{formatScheduleTime(schedule.time)}</Text>
        <Text style={styles.repeat}>{formatRepeat(schedule)}</Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={12}>
        <Text style={styles.delete}>Delete</Text>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8EC',
  },
  content: { flex: 1 },
  title: { fontSize: 17, fontWeight: '600', color: '#111827' },
  time: { marginTop: 6, fontSize: 26, fontWeight: '700', color: '#2563EB' },
  repeat: { marginTop: 4, color: '#6B7280' },
  delete: { color: '#DC2626', fontWeight: '600', paddingLeft: 12 },
});
