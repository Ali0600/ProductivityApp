import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

import App from './App';

// Register background handler for Firebase notifications
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[BACKGROUND] ===== FIREBASE BACKGROUND MESSAGE =====');
  console.log('[BACKGROUND] Message:', remoteMessage);
  console.log('[BACKGROUND] ==========================================');
});

// Set up foreground handler at app level
messaging().onMessage(async remoteMessage => {
  console.log('[FOREGROUND] ===== FIREBASE FOREGROUND MESSAGE =====');
  console.log('[FOREGROUND] Message received:', remoteMessage);
  console.log('[FOREGROUND] Title:', remoteMessage.notification?.title);
  console.log('[FOREGROUND] Body:', remoteMessage.notification?.body);
  console.log('[FOREGROUND] ========================================');
  
  // Show native notification-style alert
  Alert.alert(
    remoteMessage.notification?.title || 'Firebase Notification',
    remoteMessage.notification?.body || 'No body',
    [{ text: 'OK' }]
  );
});

console.log('[INDEX] Firebase message handlers registered at app level');

registerRootComponent(App);