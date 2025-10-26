import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { OfflineQueueProvider } from './src/context/OfflineQueueContext';

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

const App: React.FC = () => (
  <SafeAreaProvider>
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <OfflineQueueProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </OfflineQueueProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  </SafeAreaProvider>
);

export default App;
