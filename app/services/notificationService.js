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
  static TWO_HOUR_NOTIFICATION_ID_KEY = 'twoHourNotificationId';
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
      
      // Get the reminder hours
      const hours = await this.getReminderHours();
      const hoursNum = parseInt(hours);
      
      // If hours is 0, don't schedule any reminders
      if (hoursNum <= 0) {
        console.log('Task reminders disabled (0 hours)');
        return null;
      }
      
      // Schedule a new reminder
      console.log(`Scheduling task reminder every ${hours} hours`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to be productive!',
          body: 'Finish a Task',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: 'task_reminder',
            mode: 'custom',
            hours: hoursNum,
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: hoursNum * 60 * 60, // Convert hours to seconds
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
   * Start 10-minute recurring notifications using scheduled notifications
   * This works in background and avoids system throttling
   * @returns {Promise<string|null>} - Notification ID or null if failed
   */
  static async start60SecondNotifications() {
    try {
      // Stop any existing notifications
      await this.stop60SecondNotifications();
      
      console.log('Starting 10-minute recurring notifications');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Productivity Reminder',
          body: 'Stay focused and productive!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: '10_minute_reminder',
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: 600, // 10 minutes (600 seconds)
          repeats: true,
        },
      });
      
      // Save the notification ID so we can cancel it later
      await AsyncStorage.setItem(this.SIXTY_SECOND_NOTIFICATION_ID_KEY, notificationId);
      
      console.log(`Scheduled 10-minute notification with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling 10-minute notification:', error);
      return null;
    }
  }

  /**
   * Stop the 10-minute recurring notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async stop60SecondNotifications() {
    try {
      // Get the saved notification ID
      const notificationId = await AsyncStorage.getItem(this.SIXTY_SECOND_NOTIFICATION_ID_KEY);
      
      if (notificationId) {
        // Cancel the notification
        console.log(`Cancelling 10-minute notification with ID: ${notificationId}`);
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        
        // Clear the saved notification ID
        await AsyncStorage.removeItem(this.SIXTY_SECOND_NOTIFICATION_ID_KEY);
        console.log('10-minute notifications stopped');
      }
      
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
   * Start 2-hour recurring notifications
   * @returns {Promise<string|null>} - Notification ID or null if failed
   */
  static async start2HourNotifications() {
    try {
      // Stop any existing 2-hour notifications
      await this.stop2HourNotifications();
      
      console.log('Starting 2-hour recurring notifications');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '2 Hour Notification',
          body: 'Time for a productivity check-in!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: '2_hour_reminder',
            timestamp: Date.now(),
          },
        },
        trigger: {
          seconds: 7200, // 2 hours (7200 seconds)
          repeats: true,
        },
      });
      
      // Save the notification ID so we can cancel it later
      await AsyncStorage.setItem(this.TWO_HOUR_NOTIFICATION_ID_KEY, notificationId);
      
      console.log(`Scheduled 2-hour notification with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling 2-hour notification:', error);
      return null;
    }
  }

  /**
   * Stop the 2-hour recurring notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async stop2HourNotifications() {
    try {
      // Get the saved notification ID
      const notificationId = await AsyncStorage.getItem(this.TWO_HOUR_NOTIFICATION_ID_KEY);
      
      if (notificationId) {
        // Cancel the notification
        console.log(`Cancelling 2-hour notification with ID: ${notificationId}`);
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        
        // Clear the saved notification ID
        await AsyncStorage.removeItem(this.TWO_HOUR_NOTIFICATION_ID_KEY);
        console.log('2-hour notifications stopped');
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping 2-hour notifications:', error);
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
      await AsyncStorage.removeItem(this.TWO_HOUR_NOTIFICATION_ID_KEY);
      console.log('All notifications cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
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