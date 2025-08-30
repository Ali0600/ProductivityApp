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
      try {
        console.log('🔔 APP.JS: Starting notification initialization...');
        const token = await NotificationService.registerForPushNotificationsAsync();
        await NotificationService.initializeBackgroundNotifications();
        
        // Send one immediate test notification
        await NotificationService.sendImmediateNotification(
          'App Started',
          'Notifications are working!'
        );
        
        // Schedule our test notification
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
        <Homepage/>
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}