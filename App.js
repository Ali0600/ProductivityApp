import { StyleSheet, Text, View } from 'react-native';
import Homepage from './app/screens/Homepage';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppStateProvider } from './app/context/AppStateContext';
import FirebaseMessagingService from './app/services/firebaseMessagingService';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const initializeNotifications = async () => {
      console.log('Initializing Firebase notifications...');
      
      // Set up Firebase messaging handlers
      FirebaseMessagingService.setupMessageHandlers();
      
      // Get FCM token
      const fcmToken = await FirebaseMessagingService.requestPermissionAndGetToken();
      
      if (fcmToken) {
        console.log('FCM Token obtained:', fcmToken);
        
        // Subscribe to a topic for scheduled notifications
        await FirebaseMessagingService.subscribeToTopic('hourly-notifications');
        
        // TODO: Send this token to your Firebase Cloud Function
        // or use it to send notifications from Firebase Console
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