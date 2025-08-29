import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// Background task name
const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

// Define the background task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('Background notification task running...');
    
    // Send a notification every time the background task runs
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Productivity Reminder',
        body: 'Stay focused! Time to check your tasks.',
        sound: true,
        data: {
          type: 'background_reminder',
          timestamp: Date.now(),
        },
      },
      trigger: null, // Send immediately
    });
    
    console.log('Background notification sent successfully');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background notification task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

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
  static RECURRING_NOTIFICATIONS_KEY = 'recurringNotificationIds';
  static MAX_SCHEDULED_NOTIFICATIONS = 60; // iOS allows up to 64

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
            data: {
              type: 'task_reminder',
              mode: 'debug',
              timestamp: Date.now(),
            },
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
              data: {
                type: 'task_reminder',
                mode: 'hourly',
                hour: hour,
                timestamp: Date.now(),
              },
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

  /**
   * Schedule multiple recurring notifications (every minute for 60 minutes)
   * @returns {Promise<string[]>} - Array of notification IDs
   */
  static async scheduleRecurringNotifications() {
    try {
      // Cancel any existing recurring notifications
      await this.cancelRecurringNotifications();
      
      const notificationIds = [];
      const currentTime = new Date();
      
      // Schedule notifications for the next 60 minutes
      for (let i = 1; i <= this.MAX_SCHEDULED_NOTIFICATIONS; i++) {
        const triggerTime = new Date(currentTime.getTime() + (i * 60 * 1000)); // Every minute
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Productivity Reminder',
            body: `Stay focused! Reminder #${i}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: {
              type: 'recurring_reminder',
              sequence: i,
              timestamp: triggerTime.getTime(),
            },
          },
          trigger: {
            date: triggerTime,
          },
        });
        
        notificationIds.push(notificationId);
      }
      
      // Save the notification IDs
      await AsyncStorage.setItem(
        this.RECURRING_NOTIFICATIONS_KEY, 
        JSON.stringify(notificationIds)
      );
      
      console.log(`Scheduled ${notificationIds.length} recurring notifications`);
      return notificationIds;
    } catch (error) {
      console.error('Error scheduling recurring notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all recurring notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async cancelRecurringNotifications() {
    try {
      // Get saved notification IDs
      const savedIds = await AsyncStorage.getItem(this.RECURRING_NOTIFICATIONS_KEY);
      
      if (savedIds) {
        const notificationIds = JSON.parse(savedIds);
        console.log(`Cancelling ${notificationIds.length} recurring notifications`);
        
        // Cancel all notifications
        await Promise.all(
          notificationIds.map(id => Notifications.cancelScheduledNotificationAsync(id))
        );
        
        // Clear saved IDs
        await AsyncStorage.removeItem(this.RECURRING_NOTIFICATIONS_KEY);
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling recurring notifications:', error);
      return false;
    }
  }

  /**
   * Check how many notifications are still scheduled and reschedule if needed
   * @param {number} threshold - Minimum number of notifications to maintain
   * @returns {Promise<boolean>} - Success status
   */
  static async maintainRecurringNotifications(threshold = 10) {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Filter for our recurring notifications
      const recurringNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.type === 'recurring_reminder'
      );
      
      console.log(`Currently have ${recurringNotifications.length} recurring notifications scheduled`);
      
      // If we're below threshold, reschedule
      if (recurringNotifications.length < threshold) {
        console.log(`Below threshold of ${threshold}, rescheduling notifications`);
        await this.scheduleRecurringNotifications();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error maintaining recurring notifications:', error);
      return false;
    }
  }

  /**
   * Get status of recurring notifications
   * @returns {Promise<Object>} - Status object with count and next notification time
   */
  static async getRecurringNotificationStatus() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const recurringNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.type === 'recurring_reminder'
      );
      
      let nextNotificationTime = null;
      if (recurringNotifications.length > 0) {
        const nextNotification = recurringNotifications.reduce((earliest, current) => {
          const currentTime = current.trigger?.date || current.trigger?.dateComponents;
          const earliestTime = earliest.trigger?.date || earliest.trigger?.dateComponents;
          return currentTime < earliestTime ? current : earliest;
        });
        nextNotificationTime = nextNotification.trigger?.date || nextNotification.trigger?.dateComponents;
      }
      
      return {
        count: recurringNotifications.length,
        nextNotificationTime,
        isActive: recurringNotifications.length > 0,
      };
    } catch (error) {
      console.error('Error getting recurring notification status:', error);
      return { count: 0, nextNotificationTime: null, isActive: false };
    }
  }

  /**
   * Start background notifications that run even when app is closed
   * @returns {Promise<boolean>} - Success status
   */
  static async startBackgroundNotifications() {
    try {
      console.log('Starting background notifications...');
      
      // Request permissions first
      const { status } = await BackgroundFetch.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Background fetch permission not granted');
        return false;
      }
      
      // Register the background fetch task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 60, // 1 minute minimum interval (iOS may extend this)
        stopOnTerminate: false, // Continue when app is killed
        startOnBoot: true, // Start when device boots
      });
      
      console.log('Background notifications started successfully');
      return true;
    } catch (error) {
      console.error('Error starting background notifications:', error);
      return false;
    }
  }

  /**
   * Stop background notifications
   * @returns {Promise<boolean>} - Success status
   */
  static async stopBackgroundNotifications() {
    try {
      console.log('Stopping background notifications...');
      
      // Unregister the background task
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      
      console.log('Background notifications stopped successfully');
      return true;
    } catch (error) {
      console.error('Error stopping background notifications:', error);
      return false;
    }
  }

  /**
   * Check if background notifications are running
   * @returns {Promise<boolean>} - Whether background notifications are active
   */
  static async isBackgroundNotificationsActive() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
      return isRegistered;
    } catch (error) {
      console.error('Error checking background notification status:', error);
      return false;
    }
  }
}