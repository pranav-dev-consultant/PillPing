import React, { useCallback } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { ScheduleCard } from '../components/ScheduleCard';
import { useSchedule } from '../hooks/useSchedule';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ScheduleListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { schedules, loading, refresh, removeSchedule } = useSchedule();

  const confirmDelete = useCallback((scheduleId: string) => {
    const schedule = schedules.find(item => item.id === scheduleId);
    if (!schedule) return;

    Alert.alert('Delete schedule?', schedule.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeSchedule(schedule) },
    ]);
  }, [removeSchedule, schedules]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PillPing</Text>
          <Text style={styles.title}>Today’s Schedule</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('CreateSchedule')} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={schedules}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ScheduleCard schedule={item} onDelete={() => confirmDelete(item.id)} />
        )}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => void refresh()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No schedules yet</Text>
            <Text style={styles.emptyText}>Tap + to create your first reminder.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  eyebrow: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  title: { marginTop: 2, fontSize: 28, fontWeight: '800', color: '#111827' },
  addButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB' },
  addButtonText: { color: '#FFFFFF', fontSize: 30, fontWeight: '400', marginTop: -2 },
  list: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptyText: { marginTop: 8, color: '#6B7280', textAlign: 'center' },
});
