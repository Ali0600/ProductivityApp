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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default class NotificationService {
  static REMINDER_HOURS_KEY = 'reminderHours';
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
        console.log('Notification permission status:', finalStatus);
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
   * Save reminder hours setting
   * @param {string} hours - Hours between reminders, '0' to disable
   * @returns {Promise<boolean>} - Success status
   */
  static async saveReminderHours(hours) {
    try {
      console.log(`Saving reminder hours: ${hours}`);
      await AsyncStorage.setItem(this.REMINDER_HOURS_KEY, hours);
      
      // Update the scheduled notification
      await this.scheduleTaskReminder();
      
      return true;
    } catch (error) {
      console.error('Error saving reminder hours:', error);
      return false;
    }
  }

  /**
   * Get saved reminder hours
   * @returns {Promise<string>} - Hours between reminders, '0' if disabled
   */
  static async getReminderHours() {
    try {
      const hours = await AsyncStorage.getItem(this.REMINDER_HOURS_KEY);
      return hours ?? '0';
    } catch (error) {
      console.error('Error getting reminder hours:', error);
      return '0';
    }
  }

  /**
   * Schedule hourly notifications from 8am to 10pm
   * @param {boolean} debugMode - If true, sends notifications every minute instead of hourly
   * @returns {Promise<string[]>} - Array of notification IDs
   */
  static async scheduleHourlyNotifications(debugMode = true) {
    try {
      // Cancel any existing reminders
      await this.cancelAllNotifications();
      
      const notificationIds = [];
      
      if (debugMode) {
        // Debug mode: send notification every minute for testing
        console.log('Debug mode: scheduling notification every minute');
        
        // First send an immediate notification to test
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'DEBUG: Immediate Test',
            body: 'If you see this, notifications are working',
            sound: true,
          },
          trigger: null,
        });
        
        // Then schedule repeating notifications
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time to be productive! (DEBUG)',
            body: 'Finish a Task - Debug Mode',
            sound: true,
          },
          trigger: {
            seconds: 60, // Every minute
            repeats: true,
          },
        });
        
        notificationIds.push(notificationId);
        console.log(`Scheduled debug notification every minute with ID: ${notificationId}`);
      } else {
        // Normal mode: schedule notifications for each hour from 8am to 10pm
        for (let hour = 8; hour <= 22; hour++) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Time to be productive!',
              body: 'Finish a Task',
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              hour: hour,
              minute: 0,
              repeats: true,
            },
          });
          
          notificationIds.push(notificationId);
          console.log(`Scheduled notification for ${hour}:00 with ID: ${notificationId}`);
        }
      }
      
      // Save all notification IDs
      await AsyncStorage.setItem('hourlyNotificationIds', JSON.stringify(notificationIds));
      
      const modeText = debugMode ? 'debug (every minute)' : 'hourly (8am to 10pm)';
      console.log(`Scheduled ${notificationIds.length} ${modeText} notifications`);
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling hourly notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all hourly notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async cancelAllNotifications() {
    try {
      // Cancel the old task reminder
      await this.cancelTaskReminder();
      
      // Cancel hourly notifications
      const savedIds = await AsyncStorage.getItem('hourlyNotificationIds');
      if (savedIds) {
        const notificationIds = JSON.parse(savedIds);
        for (const id of notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(id);
          console.log(`Cancelled notification with ID: ${id}`);
        }
        await AsyncStorage.removeItem('hourlyNotificationIds');
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
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