import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CalendarDays, History, UserRound } from 'lucide-react-native';

import { ScheduleListScreen } from '../features/schedule/screens/ScheduleListScreen';
import { HistoryScreen } from '../features/history/screens/HistoryScreen';
import { AccountScreen } from '../features/account/screens/AccountScreen';
import { useTheme } from '../theme/ThemeProvider';
import type { ReminderOccurrenceTarget } from '../services/notifications/notificationService';

export type RootTabParamList = {
  Schedule: { notificationTarget?: ReminderOccurrenceTarget; focusKey?: number } | undefined;
  History: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function ScheduleTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return <CalendarDays color={color} size={22} strokeWidth={focused ? 2.4 : 1.8} />;
}

function HistoryTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return <History color={color} size={22} strokeWidth={focused ? 2.4 : 1.8} />;
}

function AccountTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return <UserRound color={color} size={22} strokeWidth={focused ? 2.4 : 1.8} />;
}

export function BottomTabNavigator() {
  const { palette } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Schedule"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleListScreen}
        options={{
          tabBarLabel: 'Schedule',
          tabBarAccessibilityLabel: 'Schedule tab',
          tabBarIcon: ScheduleTabIcon,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarAccessibilityLabel: 'History tab',
          tabBarIcon: HistoryTabIcon,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarAccessibilityLabel: 'Account tab',
          tabBarIcon: AccountTabIcon,
        }}
      />
    </Tab.Navigator>
  );
}
