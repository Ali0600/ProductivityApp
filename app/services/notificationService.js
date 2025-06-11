import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications to show when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default class NotificationService {
  static REMINDER_MINUTES_KEY = 'reminderMinutes';
  static NOTIFICATION_ID_KEY = 'taskReminderNotificationId';

  /**
   * Register for push notifications
   * @returns {Promise<string|null>} Expo push token or null if not available
   */
  static async registerForPushNotificationsAsync() {
    let token = null;
    
    if (Platform.OS === 'android') {
      // Set notification channel for Android
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      // Check if we have permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // If we don't have permission, ask for it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // If we still don't have permission, we can't send notifications
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
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
   * Save reminder minutes setting
   * @param {string} minutes - Minutes between reminders, '0' to disable
   * @returns {Promise<boolean>} - Success status
   */
  static async saveReminderMinutes(minutes) {
    try {
      const minutesNum = parseInt(minutes, 10);
      
      if (isNaN(minutesNum) || minutesNum < 0) {
        console.error('Reminder minutes must be a non-negative integer');
        return false;
      }
      if (minutesNum > 10080) {
        console.error('Reminder minutes cannot exceed 7 days (10,080 minutes)');
        return false;
      }
      
      console.log(`Saving reminder minutes: ${minutes}`);
      await AsyncStorage.setItem(this.REMINDER_MINUTES_KEY, minutes);
      
      // Update the scheduled notification
      await this.scheduleTaskReminder();
      
      return true;
    } catch (error) {
      console.error('Error saving reminder minutes:', error);
      return false;
    }
  }

  /**
   * Get saved reminder minutes
   * @returns {Promise<string>} - Minutes between reminders, '0' if disabled
   */
  static async getReminderMinutes() {
    try {
      const minutes = await AsyncStorage.getItem(this.REMINDER_MINUTES_KEY);
      return minutes ?? '0';
    } catch (error) {
      console.error('Error getting reminder minutes:', error);
      return '0';
    }
  }

  /**
   * Schedule a recurring task reminder notification
   * @returns {Promise<string|null>} - Notification ID or null if disabled/failed
   */
  static async scheduleTaskReminder() {
    try {
      // Cancel any existing reminders
      await this.cancelTaskReminder();
      
      // Get the reminder minutes
      const minutes = await this.getReminderMinutes();
      const minutesNum = parseInt(minutes);
      
      // If minutes is 0, don't schedule any reminders
      if (minutesNum <= 0) {
        console.log('Task reminders disabled (0 minutes)');
        return null;
      }
      
      // Convert minutes to seconds
      const intervalSeconds = minutesNum * 60;
      console.log(`Scheduling task reminder every ${minutes} minutes`);
      
      // Try just one notification first to test
      console.log(`Scheduling single notification for ${intervalSeconds} seconds from now`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to be productive!',
          body: 'Finish a Task',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          seconds: intervalSeconds,
        },
      });
      
      // Save the notification ID
      await AsyncStorage.setItem(this.NOTIFICATION_ID_KEY, notificationId);
      
      console.log(`Scheduled notification for ${intervalSeconds} seconds from now with ID: ${notificationId}`);
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
      // Cancel ALL scheduled notifications to be safe
      console.log('Cancelling all scheduled notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Clear the saved notification ID
      await AsyncStorage.removeItem(this.NOTIFICATION_ID_KEY);
      
      return true;
    } catch (error) {
      console.error('Error cancelling task reminder:', error);
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