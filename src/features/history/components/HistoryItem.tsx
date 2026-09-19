import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { HistoryItem as HistoryItemType } from '../types/history.types';

type Props = { item: HistoryItemType };

export function HistoryItem({ item }: Props) {
  const statusLabel = item.status[0].toUpperCase() + item.status.slice(1);

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>{item.scheduleTitle}</Text>
        <Text style={styles.date}>{new Date(item.scheduledAt).toLocaleString()}</Text>
      </View>
      <Text style={[styles.status, item.status === 'taken' && styles.taken, item.status === 'skipped' && styles.skipped]}>
        {statusLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E6E8EC', marginBottom: 12 },
  main: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  date: { marginTop: 5, color: '#6B7280', fontSize: 12 },
  status: { marginLeft: 12, color: '#D97706', fontWeight: '700' },
  taken: { color: '#16A34A' },
  skipped: { color: '#DC2626' },
});
