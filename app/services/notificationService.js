import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Configure notifications to show when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default class NotificationService {
  static NOTIFICATION_ID_KEY = 'taskReminderNotificationId';
  static SIXTY_SECOND_NOTIFICATION_ID_KEY = 'sixtySecondNotificationId';
  static ONE_HOUR_NOTIFICATION_ID_KEY = 'oneHourNotificationId';
  static SIXTY_SECOND_TIMER_ID = null;

  /**
   * Initialize background notification handling
   * @returns {Promise<void>}
   */
  static async initializeBackgroundNotifications() {
    try {
      console.log('Initializing background notification handlers...');

      // Add notification response listeners (when user taps notification)
      const subscription = Notifications.addNotificationResponseReceivedListener(
        this.handleNotificationResponse
      );

      // Add notification received listeners (for foreground)
      const receivedSubscription = Notifications.addNotificationReceivedListener(
        this.handleNotificationReceived
      );

      console.log('Background notification handlers initialized successfully');
      return { subscription, receivedSubscription };
    } catch (error) {
      console.error('Error initializing background notifications:', error);
    }
  }

  /**
   * Handle notification response (when user taps on notification)
   * @param {Object} response - Notification response object
   */
  static handleNotificationResponse = (response) => {
    console.log('Notification response received:', response);
    
    const { notification, userText } = response;
    console.log('User tapped on notification:', notification.request.content.title);
    
    // Handle the notification tap
    // You can navigate to specific screens, update app state, etc.
    if (notification.request.content.data) {
      console.log('Notification data:', notification.request.content.data);
    }
  };

  /**
   * Handle notification received (when app is in foreground)
   * @param {Object} notification - Notification object
   */
  static handleNotificationReceived = (notification) => {
    console.log('Notification received in foreground:', notification);
    
    // Handle foreground notification
    // You can show custom UI, update app state, etc.
  };

  /**
   * Register for push notifications with enhanced TestFlight support
   * @returns {Promise<string|null>} Expo push token or null if not available
   */
  static async registerForPushNotificationsAsync() {
    let token = null;
    

    if (Device.isDevice) {
      // Check if we have permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      console.log('Initial notification permission status:', existingStatus);
      
      // If we don't have permission, ask for it with all permission types
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: true,
            provideAppNotificationSettings: true,
            allowProvisional: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
        console.log('Requested notification permission status:', finalStatus);
      }
      
      // If we still don't have permission, we can't send notifications
      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permission!');
        console.log('Permission status details:', await Notifications.getPermissionsAsync());
        return null;
      }
      
      try {
        // Get the token
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra?.eas?.projectId,
        })).data;
        console.log("Successfully obtained push token:", token);
      } catch (tokenError) {
        console.error("Error getting push token:", tokenError);
        // Continue without a token, but at least don't crash
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  /**
   * Schedule a recurring task reminder notification
   * @returns {Promise<string|null>} - Notification ID or null if disabled/failed
   */
  static async scheduleTaskReminder() {
    try {
      // Cancel any existing reminders
      await this.cancelTaskReminder();
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to be productive!',
          body: 'Finish a Task',
          sound: true,
          data: {
            type: 'task_reminder',
            mode: 'custom',
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: 1 * 60 * 60,
          repeats: true,
        },
      });
      
      // Save the notification ID so we can cancel it later
      await AsyncStorage.setItem(this.NOTIFICATION_ID_KEY, notificationId);
      
      console.log(`Scheduled task reminder with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling task reminder:', error);
      return null;
    }
  }

  /**
   * Cancel the recurring task reminder
   * @returns {Promise<boolean>} - Success status
   */
  static async cancelTaskReminder() {
    try {
      // Get the saved notification ID
      const notificationId = await AsyncStorage.getItem(this.NOTIFICATION_ID_KEY);
      
      if (notificationId) {
        // Cancel the notification
        console.log(`Cancelling task reminder with ID: ${notificationId}`);
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        
        // Clear the saved notification ID
        await AsyncStorage.removeItem(this.NOTIFICATION_ID_KEY);
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling task reminder:', error);
      return false;
    }
  }

  /**
   * Start 60-second recurring notifications using recursive scheduling
   * @returns {Promise<boolean>} - Success status
   */
  static async start60SecondNotifications() {
    try {
      // Stop any existing notifications
      await this.stop60SecondNotifications();
      
      console.log('Starting 60-second recurring notifications using recursive approach');
      
      // Set a flag to indicate 60-second notifications are running
      await AsyncStorage.setItem('sixtySecondNotificationRunning', 'true');
      
      // Start the recursive notification scheduling
      this.scheduleNext60SecondNotification();
      
      return true;
    } catch (error) {
      console.error('Error starting 60-second notifications:', error);
      return false;
    }
  }

  /**
   * Schedule the next 60-second notification in the sequence
   */
  static async scheduleNext60SecondNotification() {
    try {
      // Check if we should still be running
      const isRunning = await AsyncStorage.getItem('sixtySecondNotificationRunning');
      if (isRunning !== 'true') {
        console.log('60-second notifications stopped, not scheduling next one');
        return;
      }

      console.log('Scheduling next 60-second notification in 60 seconds');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '60 Second Reminder',
          body: `Quick productivity check! - ${new Date().toLocaleTimeString()}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: '60_second_reminder',
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: 60, // 60 seconds
          repeats: false, // Single notification
        },
      });
      
      console.log(`Scheduled 60-second notification with ID: ${notificationId}`);
      
      // Schedule the next one after 60 seconds
      setTimeout(() => {
        this.scheduleNext60SecondNotification();
      }, 60000); // 60 seconds = 60,000 milliseconds
      
    } catch (error) {
      console.error('Error scheduling next 60-second notification:', error);
    }
  }

  /**
   * Stop the 60-second recurring notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async stop60SecondNotifications() {
    try {
      console.log('Stopping 60-second notifications');
      
      // Set flag to stop the recursive scheduling
      await AsyncStorage.setItem('sixtySecondNotificationRunning', 'false');
      
      console.log('60-second notifications stopped');
      return true;
    } catch (error) {
      console.error('Error stopping 60-second notifications:', error);
      return false;
    }
  }

  /**
   * Start 10-minute recurring notifications using recursive scheduling
   * @returns {Promise<boolean>} - Success status
   */
  static async start10MinuteNotifications() {
    try {
      // Stop any existing notifications
      await this.stop10MinuteNotifications();
      
      console.log('Starting 10-minute recurring notifications using recursive approach');
      
      // Set a flag to indicate 10-minute notifications are running
      await AsyncStorage.setItem('tenMinuteNotificationRunning', 'true');
      
      // Start the recursive notification scheduling
      this.scheduleNext10MinuteNotification();
      
      return true;
    } catch (error) {
      console.error('Error starting 10-minute notifications:', error);
      return false;
    }
  }

  /**
   * Schedule the next 10-minute notification in the sequence
   */
  static async scheduleNext10MinuteNotification() {
    try {
      // Check if we should still be running
      const isRunning = await AsyncStorage.getItem('tenMinuteNotificationRunning');
      if (isRunning !== 'true') {
        console.log('10-minute notifications stopped, not scheduling next one');
        return;
      }

      console.log('Scheduling next 10-minute notification in 10 minutes');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Productivity Reminder',
          body: `Stay focused and productive! - ${new Date().toLocaleTimeString()}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: '10_minute_reminder',
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: 600, // 10 minutes (600 seconds)
          repeats: false, // Single notification
        },
      });
      
      console.log(`Scheduled 10-minute notification with ID: ${notificationId}`);
      
      // Schedule the next one after 10 minutes
      setTimeout(() => {
        this.scheduleNext10MinuteNotification();
      }, 600000); // 10 minutes = 600,000 milliseconds
      
    } catch (error) {
      console.error('Error scheduling next 10-minute notification:', error);
    }
  }

  /**
   * Stop the 10-minute recurring notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async stop10MinuteNotifications() {
    try {
      console.log('Stopping 10-minute notifications');
      
      // Set flag to stop the recursive scheduling
      await AsyncStorage.setItem('tenMinuteNotificationRunning', 'false');
      
      console.log('10-minute notifications stopped');
      return true;
    } catch (error) {
      console.error('Error stopping 10-minute notifications:', error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   * @returns {Promise<Array>} - Array of scheduled notifications
   */
  static async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('All scheduled notifications:', notifications);
      return notifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Start 1-hour recurring notifications using recursive scheduling
   * @returns {Promise<boolean>} - Success status
   */
  static async start1HourNotifications() {
    try {
      // Stop any existing 1-hour notifications
      await this.stop1HourNotifications();
      
      console.log('Starting 1-hour recurring notifications using recursive approach');
      
      // Set a flag to indicate 1-hour notifications are running
      await AsyncStorage.setItem('oneHourNotificationRunning', 'true');
      
      // Start the recursive notification scheduling
      this.scheduleNext1HourNotification();
      
      return true;
    } catch (error) {
      console.error('Error starting 1-hour notifications:', error);
      return false;
    }
  }

  /**
   * Schedule the next 1-hour notification in the sequence
   */
  static async scheduleNext1HourNotification() {
    try {
      // Check if we should still be running
      const isRunning = await AsyncStorage.getItem('oneHourNotificationRunning');
      if (isRunning !== 'true') {
        console.log('1-hour notifications stopped, not scheduling next one');
        return;
      }

      console.log('Scheduling next 1-hour notification in 1 hour');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '1 Hour Notification',
          body: `Time for a productivity check-in! - ${new Date().toLocaleTimeString()}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: '1_hour_reminder',
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: 3600, // 1 hour (3600 seconds)
          repeats: false, // Single notification
        },
      });
      
      console.log(`Scheduled 1-hour notification with ID: ${notificationId}`);
      
      // Schedule the next one after 1 hour
      setTimeout(() => {
        this.scheduleNext1HourNotification();
      }, 3600000); // 1 hour = 3,600,000 milliseconds
      
    } catch (error) {
      console.error('Error scheduling next 1-hour notification:', error);
    }
  }

  /**
   * Stop the 1-hour recurring notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async stop1HourNotifications() {
    try {
      console.log('Stopping 1-hour notifications');
      
      // Set flag to stop the recursive scheduling
      await AsyncStorage.setItem('oneHourNotificationRunning', 'false');
      
      console.log('1-hour notifications stopped');
      return true;
    } catch (error) {
      console.error('Error stopping 1-hour notifications:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.NOTIFICATION_ID_KEY);
      await AsyncStorage.removeItem(this.SIXTY_SECOND_NOTIFICATION_ID_KEY);
      await AsyncStorage.removeItem(this.ONE_HOUR_NOTIFICATION_ID_KEY);
      console.log('All notifications cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }

  /**
   * Start a test notification that repeats every 30 seconds using recursive scheduling
   * @returns {Promise<boolean>} - Success status
   */
  static async startTestNotifications() {
    try {
      // Cancel any existing test notifications
      await this.stopTestNotifications();
      
      console.log('Starting test notifications (30 seconds) using recursive approach');
      
      // Set a flag to indicate test notifications are running
      await AsyncStorage.setItem('testNotificationRunning', 'true');
      
      // Start the recursive notification scheduling
      this.scheduleNextTestNotification();
      
      return true;
    } catch (error) {
      console.error('Error starting test notifications:', error);
      return false;
    }
  }

  /**
   * Schedule the next test notification in the sequence
   */
  static async scheduleNextTestNotification() {
    try {
      // Check if we should still be running
      const isRunning = await AsyncStorage.getItem('testNotificationRunning');
      if (isRunning !== 'true') {
        console.log('Test notifications stopped, not scheduling next one');
        return;
      }

      console.log('Scheduling next test notification in 30 seconds');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: `Test notification at ${new Date().toLocaleTimeString()}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: 'test_notification',
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: 30, // 30 seconds
          repeats: false, // Single notification
        },
      });
      
      console.log(`Scheduled test notification with ID: ${notificationId}`);
      
      // Schedule the next one after 30 seconds
      setTimeout(() => {
        this.scheduleNextTestNotification();
      }, 30000);
      
    } catch (error) {
      console.error('Error scheduling next test notification:', error);
    }
  }

  /**
   * Stop test notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async stopTestNotifications() {
    try {
      console.log('Stopping test notifications');
      
      // Set flag to stop the recursive scheduling
      await AsyncStorage.setItem('testNotificationRunning', 'false');
      
      // Cancel all scheduled notifications to be safe
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      console.log('Test notifications stopped');
      return true;
    } catch (error) {
      console.error('Error stopping test notifications:', error);
      return false;
    }
  }

  /**
   * Send an immediate notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @returns {Promise<string|null>} - Notification ID or null if failed
   */
  static async sendImmediateNotification(title, body) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Null trigger means send immediately
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return null;
    }
  }
}