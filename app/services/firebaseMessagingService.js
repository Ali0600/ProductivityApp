import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class FirebaseMessagingService {
  static FCM_TOKEN_KEY = 'fcmToken';

  /**
   * Request notification permissions and get FCM token
   * @returns {Promise<string|null>} FCM token or null if not available
   */
  static async requestPermissionAndGetToken() {
    try {
      // Request permission (iOS)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        
        // Get FCM token
        const fcmToken = await messaging().getToken();
        
        if (fcmToken) {
          console.log('FCM Token:', fcmToken);
          
          // Save token locally
          await AsyncStorage.setItem(this.FCM_TOKEN_KEY, fcmToken);
          
          return fcmToken;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Set up message handlers
   */
  static setupMessageHandlers() {
    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Message received in foreground:', remoteMessage);
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in background:', remoteMessage);
    });

    // Handle notification opened app from background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app from background:', remoteMessage);
    });

    // Handle notification opened app from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
        }
      });
  }

  /**
   * Subscribe to a topic for scheduled notifications
   * @param {string} topic - Topic name
   */
  static async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  /**
   * Get saved FCM token
   * @returns {Promise<string|null>} Saved FCM token
   */
  static async getSavedToken() {
    try {
      return await AsyncStorage.getItem(this.FCM_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting saved FCM token:', error);
      return null;
    }
  }
}