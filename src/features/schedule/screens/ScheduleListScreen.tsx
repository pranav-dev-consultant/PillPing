import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { ScheduleCard } from '../components/ScheduleCard';
import { useSchedule } from '../hooks/useSchedule';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeProvider';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ScheduleListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { schedules, loading, refresh, removeSchedule } = useSchedule();
  const { palette } = useTheme();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const confirmDelete = useCallback((scheduleId: string) => {
    const schedule = schedules.find(item => item.id === scheduleId);
    if (!schedule) return;

    Alert.alert('Delete schedule?', schedule.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeSchedule(schedule) },
    ]);
  }, [removeSchedule, schedules]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.text }]}>Schedules</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Create schedule" onPress={() => navigation.navigate('CreateSchedule')} style={[styles.addButton, { backgroundColor: palette.primary }]}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={schedules}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ScheduleCard
            schedule={item}
            onPress={() => navigation.navigate('CreateSchedule', { mode: 'edit', schedule: item })}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => void refresh()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>No schedules yet</Text>
            <Text style={[styles.emptyText, { color: palette.muted }]}>Tap + to create your first reminder.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  eyebrow: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  title: { marginTop: 2, fontSize: 28, fontWeight: '800' },
  addButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 30, fontWeight: '400', marginTop: -2 },
  list: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { marginTop: 8, textAlign: 'center' },
});
