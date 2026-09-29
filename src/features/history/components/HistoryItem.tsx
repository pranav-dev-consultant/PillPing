import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { HistoryItem as HistoryItemType } from '../types/history.types';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = { item: HistoryItemType };

export function HistoryItem({ item }: Props) {
  const { palette } = useTheme();
  const statusLabel = item.status[0].toUpperCase() + item.status.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.main}>
        <Text style={[styles.title, { color: palette.text }]}>{item.scheduleTitle}</Text>
        <Text style={[styles.date, { color: palette.muted }]}>{new Date(item.scheduledAt).toLocaleString()}</Text>
      </View>
      <Text style={[styles.status, { color: item.status === 'taken' ? palette.success : item.status === 'skipped' ? palette.danger : palette.warning }]}>
        {statusLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  main: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  date: { marginTop: 5, fontSize: 12 },
  status: { marginLeft: 12, fontWeight: '700' },
});
