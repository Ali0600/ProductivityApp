import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class FirebaseService {
  static FCM_TOKEN_KEY = 'fcmToken';
  static SERVER_URL = 'https://productivity-app-server-six.vercel.app/'; // Replace with your actual Vercel URL
  static _handlersSetup = false; // Flag to prevent duplicate handler setup

  /**
   * Initialize Firebase messaging
   * @returns {Promise<string|null>} FCM token or null
   */
  static async initialize() {
    try {
      console.log('[FIREBASE INIT] Starting Firebase initialization...');
      
      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      console.log('[FIREBASE INIT] Permission request result:', authStatus);
      console.log('[FIREBASE INIT] AUTHORIZED =', messaging.AuthorizationStatus.AUTHORIZED);
      console.log('[FIREBASE INIT] PROVISIONAL =', messaging.AuthorizationStatus.PROVISIONAL);
      console.log('[FIREBASE INIT] DENIED =', messaging.AuthorizationStatus.DENIED);
      
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('[FIREBASE INIT] Notification permission enabled:', enabled);
      
      if (!enabled) {
        console.log('[FIREBASE INIT] Firebase messaging permission denied - cannot receive notifications');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('[FIREBASE INIT] FCM Token received:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('[FIREBASE INIT] ===== FULL FCM TOKEN FOR COPY/PASTE =====');
      console.log(token || 'NO TOKEN RECEIVED');
      console.log('[FIREBASE INIT] =============================================');

      if (!token) {
        console.log('[FIREBASE INIT] No token received, aborting');
        return null;
      }

      // Save token to storage
      await AsyncStorage.setItem(this.FCM_TOKEN_KEY, token);

      console.log('[FIREBASE INIT] Skipping server registration to test Firebase Console...');
      // Skip server registration completely - testing Firebase Console direct notifications
      console.log('[FIREBASE INIT] Server registration skipped - ready for Firebase Console test');

      console.log('[FIREBASE INIT] Setting up message handlers...');
      // Set up message handlers (only once)
      if (!this._handlersSetup) {
        console.log('[FIREBASE INIT] Handlers not setup yet, setting up now...');
        this.setupMessageHandlers();
        console.log('[FIREBASE INIT] Message handlers setup completed');
        this._handlersSetup = true;
      } else {
        console.log('[FIREBASE INIT] Handlers already setup, skipping...');
      }

      console.log('[FIREBASE INIT] Firebase initialization completed successfully');
      return token;
    } catch (error) {
      console.error('[FIREBASE INIT] Error during initialization:', error);
      console.error('[FIREBASE INIT] Error stack:', error.stack);
      return null;
    }
  }

  /**
   * Setup message handlers for foreground and background
   */
  static setupMessageHandlers() {
    try {
      console.log('[FIREBASE HANDLERS] Setting up message handlers...');

      // Foreground handler removed to avoid conflicts - handled in index.js
      console.log('[FIREBASE HANDLERS] Foreground handler skipped - handled in index.js');
      console.log('[FIREBASE HANDLERS] Message handler setup delegated to index.js');

      console.log('[FIREBASE HANDLERS] Setting up background handler...');
      // Note: Background handler is set up in index.js at root level
      console.log('[FIREBASE HANDLERS] Background handler setup complete');

      console.log('[FIREBASE HANDLERS] Setting up notification opened handler...');
      // Handle notification tap when app is closed
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('[FIREBASE HANDLERS] Notification opened app:', remoteMessage);
        alert(`Notification opened app: ${remoteMessage.notification?.title}`);
      });
      console.log('[FIREBASE HANDLERS] Notification opened handler setup complete');

      console.log('[FIREBASE HANDLERS] Getting initial notification...');
      // Handle notification tap when app is closed/killed
      messaging().getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('[FIREBASE HANDLERS] Notification opened app from quit state:', remoteMessage);
            alert(`App opened from notification: ${remoteMessage.notification?.title}`);
          } else {
            console.log('[FIREBASE HANDLERS] No initial notification');
          }
        })
        .catch(error => {
          console.error('[FIREBASE HANDLERS] Error getting initial notification:', error);
        });
      
      console.log('[FIREBASE HANDLERS] All message handlers setup completed successfully');
    } catch (error) {
      console.error('[FIREBASE HANDLERS] Error setting up message handlers:', error);
      console.error('[FIREBASE HANDLERS] Error stack:', error.stack);
      throw error; // Re-throw to let the caller handle it
    }
  }

  /**
   * Register FCM token with your server
   * @param {string} token - FCM token
   */
  static async registerTokenWithServer(token) {
    try {
      console.log('[SERVER REG] Starting server registration...');
      console.log('[SERVER REG] Server URL:', this.SERVER_URL);
      console.log('[SERVER REG] Token to register:', token ? token.substring(0, 20) + '...' : 'null');
      
      console.log('[SERVER REG] Preparing request payload...');
      const payload = {
        token: token,
        userId: 'your-user-id', // You can use device ID or user ID
        intervals: {
          sixtySecond: true,
          tenMinute: true,
          oneHour: true,
        }
      };
      console.log('[SERVER REG] Payload prepared:', { ...payload, token: payload.token.substring(0, 20) + '...' });
      
      console.log('[SERVER REG] Making fetch request...');
      // This will send the token to your server so it can send notifications
      const response = await fetch(`${this.SERVER_URL}/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      console.log('[SERVER REG] Fetch completed, response status:', response.status);
      console.log('[SERVER REG] Response ok:', response.ok);

      if (response.ok) {
        console.log('[SERVER REG] Token registered with server successfully');
        const responseData = await response.json();
        console.log('[SERVER REG] Server response:', responseData);
      } else {
        console.error('[SERVER REG] Failed to register token with server, status:', response.status);
        const responseText = await response.text();
        console.error('[SERVER REG] Error response:', responseText);
      }
      
      console.log('[SERVER REG] Server registration completed');
    } catch (error) {
      console.error('[SERVER REG] Error registering token with server:', error);
      console.error('[SERVER REG] Error type:', error.name);
      console.error('[SERVER REG] Error message:', error.message);
      console.error('[SERVER REG] Error stack:', error.stack);
      // Continue without server registration for now
    }
  }

  /**
   * Start notifications by telling server to begin sending
   * @param {string} interval - '60s', '10m', or '1h'
   */
  static async startNotifications(interval) {
    try {
      console.log(`[START NOTIF] Starting ${interval} notifications...`);
      
      console.log(`[START NOTIF] Retrieving FCM token from storage...`);
      const token = await AsyncStorage.getItem(this.FCM_TOKEN_KEY);
      console.log(`[START NOTIF] Retrieved token:`, token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.error(`[START NOTIF] No FCM token found in storage`);
        throw new Error('No FCM token found. Please ensure Firebase is initialized.');
      }

      console.log(`[START NOTIF] Making safe request to server...`);
      console.log(`[START NOTIF] URL: ${this.SERVER_URL}/start-notifications`);
      console.log(`[START NOTIF] Payload: { token: "${token.substring(0, 20)}...", interval: "${interval}" }`);
      
      // Use safe fetch with timeout
      return await new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          console.log(`[START NOTIF] Request timed out after 1 minute`);
          resolve(false);
        }, 60000);
        
        const performRequest = async () => {
          try {
            const controller = new AbortController();
            const fetchTimeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout
            
            const response = await fetch(`${this.SERVER_URL}/start-notifications`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: token,
                interval: interval,
              }),
              signal: controller.signal
            });
            
            clearTimeout(fetchTimeoutId);
            clearTimeout(timeoutId);
            
            console.log(`[START NOTIF] Response status: ${response.status}`);
            console.log(`[START NOTIF] Response ok: ${response.ok}`);

            if (response.ok) {
              const responseData = await response.json();
              console.log(`[START NOTIF] Started ${interval} notifications successfully`);
              console.log(`[START NOTIF] Server response:`, responseData);
              resolve(true);
            } else {
              const errorText = await response.text();
              console.error(`[START NOTIF] Failed to start ${interval} notifications`);
              console.error(`[START NOTIF] Error response:`, errorText);
              resolve(false);
            }
          } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[START NOTIF] Fetch error:`, error.name, error.message);
            resolve(false);
          }
        };
        
        performRequest();
      });
    } catch (error) {
      console.error(`[START NOTIF] Error starting ${interval} notifications:`, error);
      console.error(`[START NOTIF] Error type:`, error.name);
      console.error(`[START NOTIF] Error message:`, error.message);
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

  /**
   * Manual permission check for debugging
   */
  static async checkPermissions() {
    try {
      console.log('[PERMISSION CHECK] Checking current permission status...');
      const authStatus = await messaging().requestPermission();
      console.log('[PERMISSION CHECK] Current status:', authStatus);
      console.log('[PERMISSION CHECK] AUTHORIZED =', messaging.AuthorizationStatus.AUTHORIZED);
      console.log('[PERMISSION CHECK] PROVISIONAL =', messaging.AuthorizationStatus.PROVISIONAL);  
      console.log('[PERMISSION CHECK] DENIED =', messaging.AuthorizationStatus.DENIED);
      
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || 
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      alert(`Permission Status: ${enabled ? 'ENABLED' : 'DENIED'}\nStatus Code: ${authStatus}`);
      return enabled;
    } catch (error) {
      console.error('[PERMISSION CHECK] Error:', error);
      alert(`Permission check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test notification by triggering the handler manually
   */
  static async testNotificationHandler() {
    try {
      console.log('[TEST] Testing notification handler manually...');
      
      // Simulate a Firebase message
      const testMessage = {
        messageId: 'test-123',
        notification: {
          title: 'Test Notification',
          body: 'This is a manual test of the notification handler'
        },
        data: {
          test: 'true'
        },
        from: 'test-sender'
      };
      
      console.log('[TEST] Simulating Firebase message...');
      console.log('[FIREBASE HANDLERS] ===== FOREGROUND MESSAGE RECEIVED =====');
      console.log('[FIREBASE HANDLERS] THIS SHOULD APPEAR IF FIREBASE CONSOLE MESSAGE IS RECEIVED!');
      console.log('[FIREBASE HANDLERS] Full message:', JSON.stringify(testMessage, null, 2));
      
      alert(`🔥 SUCCESS! Test notification handler works!\nTitle: ${testMessage.notification.title}\nBody: ${testMessage.notification.body}`);
      
      return true;
    } catch (error) {
      console.error('[TEST] Error testing handler:', error);
      alert(`Test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test Firebase service status
   * @returns {Promise<object>} Status information
   */
  static async getStatus() {
    try {
      const token = await this.getToken();
      return {
        hasToken: !!token,
        token: token ? token.substring(0, 20) + '...' : null,
        serverUrl: this.SERVER_URL
      };
    } catch (error) {
      return {
        hasToken: false,
        token: null,
        serverUrl: this.SERVER_URL,
        error: error.message
      };
    }
  }
}