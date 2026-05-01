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

const isInQuietHours = (date, startMin, endMin) => {
  if (startMin === endMin) return false;
  const minOfDay = date.getHours() * 60 + date.getMinutes();
  if (startMin < endMin) {
    return minOfDay >= startMin && minOfDay < endMin;
  }
  return minOfDay >= startMin || minOfDay < endMin;
};

export default class NotificationService {
  static NOTIFICATION_ID_KEY = 'taskReminderNotificationId';
  static RECURRING_NOTIFICATIONS_KEY = 'recurringNotificationIds';
  static NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';
  static NOTIFICATION_SOURCE_KEY = 'notificationSourceMainList';
  static QUIET_HOURS_ENABLED_KEY = 'quietHoursEnabled';
  static QUIET_HOURS_START_KEY = 'quietHoursStartMinutes';
  static QUIET_HOURS_END_KEY = 'quietHoursEndMinutes';
  static MAX_SCHEDULED_NOTIFICATIONS = 60; // iOS allows up to 64

  static async setNotificationSource(mainListName) {
    if (mainListName) {
      await AsyncStorage.setItem(this.NOTIFICATION_SOURCE_KEY, mainListName);
    } else {
      await AsyncStorage.removeItem(this.NOTIFICATION_SOURCE_KEY);
    }
  }

  static async getQuietHours() {
    const [enabledRaw, startRaw, endRaw] = await Promise.all([
      AsyncStorage.getItem(this.QUIET_HOURS_ENABLED_KEY),
      AsyncStorage.getItem(this.QUIET_HOURS_START_KEY),
      AsyncStorage.getItem(this.QUIET_HOURS_END_KEY),
    ]);
    return {
      enabled: enabledRaw === 'true',
      startMinutes: startRaw != null ? parseInt(startRaw, 10) : 0,
      endMinutes: endRaw != null ? parseInt(endRaw, 10) : 480,
    };
  }

  static async setQuietHours({ enabled, startMinutes, endMinutes }) {
    await AsyncStorage.multiSet([
      [this.QUIET_HOURS_ENABLED_KEY, enabled ? 'true' : 'false'],
      [this.QUIET_HOURS_START_KEY, String(startMinutes)],
      [this.QUIET_HOURS_END_KEY, String(endMinutes)],
    ]);
  }

  static async getNotificationsEnabled() {
    try {
      const value = await AsyncStorage.getItem(this.NOTIFICATIONS_ENABLED_KEY);
      // Missing key = first launch; default to enabled to preserve prior behavior.
      return value === null ? true : value === 'true';
    } catch (error) {
      console.error('Error reading notifications-enabled flag:', error);
      return true;
    }
  }

  static async setNotificationsEnabled(enabled) {
    try {
      await AsyncStorage.setItem(this.NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
      if (enabled) {
        await this.scheduleRecurringNotifications();
      } else {
        await this.cancelRecurringNotifications();
        await this.cancelAllNotifications();
        await this.cancelTaskReminder();
      }
      return true;
    } catch (error) {
      console.error('Error setting notifications-enabled flag:', error);
      return false;
    }
  }

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
    
    //#if (Platform.OS === 'android') {
    //  // Set notification channel for Android
    //  await Notifications.setNotificationChannelAsync('task-reminders', {
    //    name: 'Task Reminders',
    //    importance: Notifications.AndroidImportance.MAX,
    //    vibrationPattern: [0, 250, 250, 250],
    //    lightColor: '#FF231F7C',
    //  });
    //}

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
  static async scheduleHourlyNotifications(debugMode = false) {
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
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
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
              data: {
                type: 'task_reminder',
                mode: 'hourly',
                hour: hour,
                timestamp: Date.now(),
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: hour,
              minute: 0,
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
          data: {
            type: 'task_reminder',
            mode: 'custom',
            hours: hoursNum,
            timestamp: Date.now(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
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

  static async getUpcomingNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const formatted = scheduled.map((n) => {
        const data = n.content?.data ?? {};
        const trigger = n.trigger ?? {};
        const fireMs =
          data.scheduledFor ??
          trigger.value ??
          (trigger.date ? new Date(trigger.date).getTime() : null);
        return {
          id: n.identifier,
          title: n.content?.title ?? '',
          body: n.content?.body ?? '',
          fireTime: fireMs ? new Date(fireMs) : null,
          sequence: data.sequence ?? null,
          type: data.type ?? 'unknown',
        };
      });
      return formatted
        .filter((n) => n.fireTime != null)
        .sort((a, b) => a.fireTime.getTime() - b.fireTime.getTime());
    } catch (error) {
      console.error('Error fetching upcoming notifications:', error);
      return [];
    }
  }

  /**
   * Schedule multiple recurring notifications (every minute for 60 minutes)
   * @returns {Promise<string[]>} - Array of notification IDs
   */
  static async scheduleRecurringNotifications(opts = {}) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.RECURRING_NOTIFICATIONS_KEY);

      let { sourceName, messages, intervalMinutes } = opts;

      if (sourceName === undefined) {
        sourceName = await AsyncStorage.getItem(this.NOTIFICATION_SOURCE_KEY);
      }
      if (!sourceName) {
        console.log('No notification source main list set; skipping schedule.');
        return [];
      }

      let source;
      if (messages === undefined || intervalMinutes === undefined) {
        const stored = await AsyncStorage.getItem('mainLists');
        const mainLists = stored ? JSON.parse(stored) : [];
        source = mainLists.find((ml) => ml.name === sourceName);
      }
      if (messages === undefined) {
        messages = source?.notificationMessages ?? [];
      }
      if (intervalMinutes === undefined) {
        intervalMinutes = source?.notificationIntervalMinutes ?? 60;
      }

      if (messages.length === 0) {
        console.log(`Source list "${sourceName}" has no messages; skipping.`);
        return [];
      }

      const quiet = await this.getQuietHours();
      const intervalMs = intervalMinutes * 60 * 1000;
      const notificationIds = [];
      const MAX_CANDIDATES = 200;
      const baseTime = Date.now();

      let scheduled = 0;
      let candidate = 0;
      while (scheduled < this.MAX_SCHEDULED_NOTIFICATIONS && candidate < MAX_CANDIDATES) {
        candidate += 1;
        const triggerDate = new Date(baseTime + candidate * intervalMs);

        if (quiet.enabled && isInQuietHours(triggerDate, quiet.startMinutes, quiet.endMinutes)) {
          continue;
        }

        const body = messages[scheduled % messages.length];
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Productivity Reminder',
            body,
            sound: true,
            data: {
              type: 'recurring_reminder',
              sequence: scheduled + 1,
              scheduledFor: triggerDate.getTime(),
              sourceMainList: sourceName,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });

        notificationIds.push(notificationId);
        scheduled += 1;
      }

      await AsyncStorage.setItem(
        this.RECURRING_NOTIFICATIONS_KEY,
        JSON.stringify(notificationIds)
      );

      const quietLabel = quiet.enabled ? `${quiet.startMinutes}–${quiet.endMinutes}` : 'off';
      console.log(`Scheduled ${notificationIds.length} recurring notifications from "${sourceName}" (${messages.length} messages cycling, every ${intervalMinutes}min, quiet=${quietLabel}).`);
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
}