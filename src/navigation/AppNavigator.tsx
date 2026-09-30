import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';

import { BottomTabNavigator, type RootTabParamList } from './BottomTabNavigator';
import { CreateScheduleScreen } from '../features/schedule/screens/CreateScheduleScreen';
import { AlarmToneScreen } from '../features/account/screens/AlarmToneScreen';
import type { Schedule } from '../features/schedule/types/schedule.types';
import { useTheme } from '../theme/ThemeProvider';

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<RootTabParamList> | undefined;
  CreateSchedule:
    | { mode: 'create'; schedule?: undefined }
    | { mode: 'edit'; schedule: Schedule }
    | undefined;
  AlarmTone: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { palette } = useTheme();

  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: palette.surface },
      headerTintColor: palette.text,
      headerTitleStyle: { color: palette.text },
      contentStyle: { backgroundColor: palette.background },
    }}>
      <Stack.Screen name="Tabs" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} options={{ presentation: 'card' }} />
      <Stack.Screen name="AlarmTone" component={AlarmToneScreen} options={{ title: 'Alarm Tone' }} />
    </Stack.Navigator>
  );
}
