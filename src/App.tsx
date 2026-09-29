import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, StatusBar, StyleSheet, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';

import { AppNavigator } from './navigation/AppNavigator';
import type { RootStackParamList } from './navigation/AppNavigator';
import { AccountProvider, useAccount } from './features/account/hooks/useAccount';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import {
  getInitialNotificationTarget,
  initializeNotificationService,
  reconcileScheduleNotifications,
  subscribeToNotificationEvents,
  type ReminderOccurrenceTarget,
} from './services/notifications/notificationService';

function AppNavigation(): React.JSX.Element {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { loading } = useAccount();
  const { palette, isDark } = useTheme();
  const pendingNotificationTarget = useRef<ReminderOccurrenceTarget | null>(null);

  const openOccurrence = useCallback((target: ReminderOccurrenceTarget) => {
    if (!navigationRef.isReady()) {
      pendingNotificationTarget.current = target;
      return;
    }
    navigationRef.navigate('Tabs', {
      screen: 'Schedule',
      params: { notificationTarget: target, focusKey: Date.now() },
    });
  }, [navigationRef]);

  useEffect(() => {
    if (!loading) void initializeNotificationService();
    const unsubscribe = subscribeToNotificationEvents(openOccurrence);
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') void reconcileScheduleNotifications();
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [loading, navigationRef, openOccurrence]);

  const handleReady = () => {
    const pendingTarget = pendingNotificationTarget.current;
    if (pendingTarget) {
      pendingNotificationTarget.current = null;
      openOccurrence(pendingTarget);
    }
    void getInitialNotificationTarget().then(target => {
      if (
        target &&
        (target.scheduleId !== pendingTarget?.scheduleId ||
          target.occurrenceId !== pendingTarget?.occurrenceId)
      ) {
        openOccurrence(target);
      }
    });
  };

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.danger,
    },
  };

  if (loading) {
    return <View style={[styles.loading, { backgroundColor: palette.background }]} />;
  }

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={navigationRef} onReady={handleReady} theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <AccountProvider>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </AccountProvider>
  );
}

export default App;

const styles = StyleSheet.create({ loading: { flex: 1 } });