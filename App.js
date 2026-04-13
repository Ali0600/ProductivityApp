import { StyleSheet, Text, View } from 'react-native';
import Homepage from './app/screens/Homepage';
import TileGrid from './app/screens/TileGrid';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppStateProvider } from './app/context/AppStateContext';
import { useMainLists } from './app/hooks/useAppState';
import NotificationService from './app/services/notificationService';
import { useEffect } from 'react';

function RootScreen() {
  const { currentMainList } = useMainLists();
  return currentMainList ? <Homepage /> : <TileGrid />;
}

export default function App() {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🔔 APP.JS: Starting notification initialization...');
        const token = await NotificationService.registerForPushNotificationsAsync();
        await NotificationService.initializeBackgroundNotifications();

        await NotificationService.scheduleRecurringNotifications();
        console.log('🔔 APP.JS: Scheduled recurring notifications');
      } catch (error) {
        console.error('🔔 APP.JS: Error in notification setup:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <RootScreen />
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}
