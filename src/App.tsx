import React, { useEffect } from 'react';
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
  getInitialNotificationScheduleId,
  initializeNotificationService,
  reconcileScheduleNotifications,
  subscribeToNotificationEvents,
} from './services/notifications/notificationService';

function AppNavigation(): React.JSX.Element {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { loading } = useAccount();
  const { palette, isDark } = useTheme();

  useEffect(() => {
    if (!loading) void initializeNotificationService();
    const unsubscribe = subscribeToNotificationEvents(() => {
      if (navigationRef.isReady()) navigationRef.navigate('Tabs');
    });
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') void reconcileScheduleNotifications();
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [loading, navigationRef]);

  const handleReady = () => {
    void getInitialNotificationScheduleId().then(scheduleId => {
      if (scheduleId && navigationRef.isReady()) navigationRef.navigate('Tabs');
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