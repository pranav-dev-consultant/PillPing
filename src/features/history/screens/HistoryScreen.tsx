import React, { useCallback } from 'react';
import { Alert, AppState, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Trash2 } from 'lucide-react-native';

import { HistoryItem } from '../components/HistoryItem';
import { useHistory } from '../hooks/useHistory';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeProvider';

export function HistoryScreen() {
  const { items, loading, refresh, clearHistory } = useHistory();
  const { palette } = useTheme();

  const confirmClearHistory = () => {
    if (items.length === 0 || loading) return;

    Alert.alert(
      'Clear History?',
      'Are you sure you want to clear all medication history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void clearHistory()
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });

    return () => subscription.remove();
  }, [refresh]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: palette.text }]}>History</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Your recent reminder actions</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear history"
          accessibilityState={{ disabled: items.length === 0 || loading }}
          disabled={items.length === 0 || loading}
          onPress={confirmClearHistory}
          hitSlop={10}
          style={({ pressed }) => [styles.clearButton, pressed && styles.pressed, (items.length === 0 || loading) && styles.disabled]}
        >
          <Trash2 size={21} color={palette.danger} />
        </Pressable>
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
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No medication history yet</Text>
            <Text style={[styles.emptyText, { color: palette.muted }]}>Your Taken, Skipped and Snoozed actions will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  heading: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 6 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
  list: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyText: { marginTop: 8, textAlign: 'center' },
});
