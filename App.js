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
      
      // Schedule background notifications
      await NotificationService.scheduleHourlyNotifications(true);
      
      // Start timer-based notifications for foreground
      const interval = setInterval(async () => {
        console.log('Sending timer notification...');
        await NotificationService.sendImmediateNotification(
          'Timer Notification',
          'This is a test notification every 60 seconds'
        );
      }, 60000); // 60 seconds
      
      // Cleanup interval on unmount
      return () => clearInterval(interval);
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