import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { refreshDeals } from '@/lib/deals';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme';

// LogBox's inspector throws when it mounts under react-native-web, which blanks
// the whole app. Errors still reach the console and the ErrorBoundary.
if (Platform.OS === 'web') LogBox.ignoreAllLogs();

export default function RootLayout() {
  const autoRefresh = useAppStore((s) => s.settings.autoRefreshDeals);

  useEffect(() => {
    // Fire-and-forget: refreshDeals falls back to cache/seed on its own, so a
    // failure here is never surfaced as a crash on launch.
    if (autoRefresh) void refreshDeals();
  }, [autoRefresh]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ErrorBoundary>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
