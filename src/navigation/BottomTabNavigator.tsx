import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ScheduleListScreen } from '../features/schedule/screens/ScheduleListScreen';
import { HistoryScreen } from '../features/history/screens/HistoryScreen';
import { AccountScreen } from '../features/account/screens/AccountScreen';

export type RootTabParamList = {
  Schedule: undefined;
  History: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Schedule"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleListScreen}
        options={{ tabBarLabel: 'Schedule', tabBarIcon: ({ color }) => <>{'◷'}</> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: 'History', tabBarIcon: () => <>{'↺'}</> }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarLabel: 'Account', tabBarIcon: () => <>{'◯'}</> }}
      />
    </Tab.Navigator>
  );
}
