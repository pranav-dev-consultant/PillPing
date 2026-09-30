import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { ScheduleCard, type ScheduleCardOccurrence } from '../components/ScheduleCard';
import type { RootTabParamList } from '../../../navigation/BottomTabNavigator';
import { useSchedule } from '../hooks/useSchedule';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeProvider';
import type { HistoryItem } from '../../history/types/history.types';
import type { ActionStatus } from '../../../types/common.types';
import { getHistory } from '../../history/services/historyService';
import type { Schedule } from '../types/schedule.types';
import { getScheduleOccurrencesOnDate } from '../utils/scheduleUtils';
import {
  performScheduleOccurrenceAction,
  type ReminderOccurrenceAction,
  type ReminderOccurrenceTarget,
} from '../../../services/notifications/notificationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScheduleRoute = RouteProp<RootTabParamList, 'Schedule'>;

function formatStoredTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getCardOccurrences(
  schedule: Schedule,
  now: Date,
  historyById: Map<string, HistoryItem>,
  notificationTarget?: ReminderOccurrenceTarget,
): ScheduleCardOccurrence[] {
  if (!schedule.isActive) return [];

  const getStatus = (occurrenceId: string): ActionStatus | undefined => {
    const item = historyById.get(`occurrence-${encodeURIComponent(occurrenceId)}`);
    return item?.isActionable ? undefined : item?.status;
  };

  const occurrences: ScheduleCardOccurrence[] = getScheduleOccurrencesOnDate(schedule, now).map(occurrence => ({
    ...occurrence,
    status: getStatus(occurrence.occurrenceId),
  }));

  if (notificationTarget?.scheduleId === schedule.id) {
    const alreadyIncluded = occurrences.some(item => item.occurrenceId === notificationTarget.occurrenceId);
    const scheduledAt = new Date(notificationTarget.scheduledAt);
    if (!alreadyIncluded && !Number.isNaN(scheduledAt.getTime())) {
      occurrences.push({
        occurrenceId: notificationTarget.occurrenceId,
        scheduledAt,
        time: formatStoredTime(scheduledAt),
        status: getStatus(notificationTarget.occurrenceId),
      });
    }
  }

  if (occurrences.length === 0) {
    const date = new Date(now);
    return schedule.times.map(time => {
      const [hour, minute] = time.split(':').map(Number);
      const scheduledAt = new Date(date);
      scheduledAt.setHours(hour, minute, 0, 0);
      return { occurrenceId: '', scheduledAt, time, upcoming: true };
    });
  }

  return occurrences.sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());
}

export function ScheduleListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScheduleRoute>();
  const { schedules, loading, refresh, removeSchedule } = useSchedule();
  const { palette } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [now, setNow] = useState(() => new Date());
  const listRef = useRef<FlatList<Schedule>>(null);
  const notificationTarget = route.params?.notificationTarget;
  const focusKey = route.params?.focusKey;
  const historyById = new Map(history.map(item => [item.id, item]));

  const refreshHistory = useCallback(async () => {
    setHistory(await getHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshHistory();
      setNow(new Date());
      const interval = setInterval(() => {
        setNow(new Date());
        void refreshHistory();
      }, 20000);
      return () => clearInterval(interval);
    }, [refresh, refreshHistory]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setNow(new Date());
        void refreshHistory();
      }
    });
    return () => subscription.remove();
  }, [refreshHistory]);

  useEffect(() => {
    if (!notificationTarget || focusKey === undefined) return;
    setNow(new Date());
    void refreshHistory();
  }, [focusKey, notificationTarget, refreshHistory]);

  useEffect(() => {
    if (!notificationTarget) return;
    const index = schedules.findIndex(item => item.id === notificationTarget.scheduleId);
    if (index < 0) return;
    requestAnimationFrame(() => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 }));
  }, [focusKey, notificationTarget, schedules]);

  const confirmDelete = useCallback((scheduleId: string) => {
    const schedule = schedules.find(item => item.id === scheduleId);
    if (!schedule) return;

    Alert.alert('Delete schedule?', schedule.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeSchedule(schedule) },
    ]);
  }, [removeSchedule, schedules]);

  const handleOccurrenceAction = useCallback(async (
    schedule: Schedule,
    occurrence: ScheduleCardOccurrence,
    action: ReminderOccurrenceAction,
  ) => {
    if (!occurrence.occurrenceId) return;
    try {
      await performScheduleOccurrenceAction({
        scheduleId: schedule.id,
        occurrenceId: occurrence.occurrenceId,
        scheduledAt: occurrence.scheduledAt.toISOString(),
        scheduleTitle: schedule.title,
        dose: String(schedule.dose),
        time: occurrence.time,
      }, action);
      setHistory(await getHistory());
      setNow(new Date());
    } catch {
      await refreshHistory();
      Alert.alert('Could not update reminder', 'Please try the action again.');
    }
  }, [refreshHistory]);

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
        ref={listRef}
        data={schedules}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ScheduleCard
            schedule={item}
            occurrences={getCardOccurrences(item, now, historyById, notificationTarget)}
            now={now}
            focusedOccurrenceId={notificationTarget?.scheduleId === item.id ? notificationTarget.occurrenceId : undefined}
            onPress={() => navigation.navigate('CreateSchedule', { mode: 'edit', schedule: item })}
            onDelete={() => confirmDelete(item.id)}
            onOccurrenceAction={(occurrence, action) => void handleOccurrenceAction(item, occurrence, action)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => {
          void refresh();
          void refreshHistory();
          setNow(new Date());
        }}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true });
        }}
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
