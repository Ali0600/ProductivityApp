import { StyleSheet, Text, View } from 'react-native';
import Homepage from './app/screens/Homepage';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppStateProvider } from './app/context/AppStateContext';
import NotificationService from './app/services/notificationService';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const initializeNotifications = async () => {
      console.log('Initializing notifications...');
      await NotificationService.registerForPushNotificationsAsync();
      
      // Initialize background notification handling
      await NotificationService.initializeBackgroundNotifications();
      
      // Schedule multiple local notifications (these work in background)
      await NotificationService.scheduleRecurringNotifications();
      
      // Start background fetch task (for true background execution)
      const backgroundStarted = await NotificationService.startBackgroundNotifications();
      console.log('Background notifications started:', backgroundStarted);
    };
    
    initializeNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <Homepage/>
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}