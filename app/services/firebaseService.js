import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class FirebaseService {
  static FCM_TOKEN_KEY = 'fcmToken';
  static SERVER_URL = 'https://productivity-app-server-six.vercel.app/'; // Replace with your actual Vercel URL

  /**
   * Initialize Firebase messaging
   * @returns {Promise<string|null>} FCM token or null
   */
  static async initialize() {
    try {
      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Firebase messaging permission denied');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('Firebase FCM Token:', token);

      // Save token to storage
      await AsyncStorage.setItem(this.FCM_TOKEN_KEY, token);

      // Register token with your server
      await this.registerTokenWithServer(token);

      // Set up message handlers
      this.setupMessageHandlers();

      return token;
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
      return null;
    }
  }

  /**
   * Setup message handlers for foreground and background
   */
  static setupMessageHandlers() {
    // Handle messages when app is in foreground
    messaging().onMessage(async remoteMessage => {
      console.log('Received foreground message:', remoteMessage);
      // You can show local notification here if needed
    });

    // Handle messages when app is in background/quit
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Received background message:', remoteMessage);
      // This runs in background - keep it minimal
    });

    // Handle notification tap when app is closed
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);
      // Handle navigation based on notification data
    });

    // Handle notification tap when app is closed/killed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
        }
      });
  }

  /**
   * Register FCM token with your server
   * @param {string} token - FCM token
   */
  static async registerTokenWithServer(token) {
    try {
      // This will send the token to your server so it can send notifications
      const response = await fetch(`${this.SERVER_URL}/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          userId: 'your-user-id', // You can use device ID or user ID
          intervals: {
            sixtySecond: true,
            tenMinute: true,
            oneHour: true,
          }
        }),
      });

      if (response.ok) {
        console.log('Token registered with server successfully');
      } else {
        console.error('Failed to register token with server');
      }
    } catch (error) {
      console.error('Error registering token with server:', error);
      // Continue without server registration for now
    }
  }

  /**
   * Start notifications by telling server to begin sending
   * @param {string} interval - '60s', '10m', or '1h'
   */
  static async startNotifications(interval) {
    try {
      const token = await AsyncStorage.getItem(this.FCM_TOKEN_KEY);
      if (!token) {
        throw new Error('No FCM token found');
      }

      const response = await fetch(`${this.SERVER_URL}/start-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          interval: interval,
        }),
      });

      if (response.ok) {
        console.log(`Started ${interval} notifications on server`);
        return true;
      } else {
        console.error(`Failed to start ${interval} notifications`);
        return false;
      }
    } catch (error) {
      console.error(`Error starting ${interval} notifications:`, error);
      return false;
    }
  }

  /**
   * Stop notifications by telling server to stop sending
   * @param {string} interval - '60s', '10m', or '1h'
   */
  static async stopNotifications(interval) {
    try {
      const token = await AsyncStorage.getItem(this.FCM_TOKEN_KEY);
      if (!token) {
        throw new Error('No FCM token found');
      }

      const response = await fetch(`${this.SERVER_URL}/stop-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          interval: interval,
        }),
      });

      if (response.ok) {
        console.log(`Stopped ${interval} notifications on server`);
        return true;
      } else {
        console.error(`Failed to stop ${interval} notifications`);
        return false;
      }
    } catch (error) {
      console.error(`Error stopping ${interval} notifications:`, error);
      return false;
    }
  }

  /**
   * Get stored FCM token
   * @returns {Promise<string|null>}
   */
  static async getToken() {
    try {
      return await AsyncStorage.getItem(this.FCM_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }
}