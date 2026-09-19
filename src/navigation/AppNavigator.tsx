import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomTabNavigator } from './BottomTabNavigator';
import { CreateScheduleScreen } from '../features/schedule/screens/CreateScheduleScreen';

export type RootStackParamList = {
  Tabs: undefined;
  CreateSchedule: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} options={{ title: 'Create Schedule', presentation: 'card' }} />
    </Stack.Navigator>
  );
}
