import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { HistoryItem } from '../components/HistoryItem';
import { useHistory } from '../hooks/useHistory';
import { SafeAreaView } from 'react-native-safe-area-context';

export function HistoryScreen() {
  const { items, loading, refresh } = useHistory();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your recent reminder actions</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <HistoryItem item={item} />}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => void refresh()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>Your Taken, Skipped and Snoozed actions will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, color: '#6B7280' },
  list: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 8, color: '#6B7280', textAlign: 'center' },
});
