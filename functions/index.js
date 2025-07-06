const {onRequest, onSchedule} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");

initializeApp();

// Cloud Function to send notifications every minute (for testing)
exports.sendHourlyNotifications = onSchedule("every 1 minutes", async (event) => {
  console.log("Sending hourly notifications...");
  
  const message = {
    notification: {
      title: "Time to be productive!",
      body: "Finish a task - Background notification working!",
    },
    topic: "hourly-notifications", // Send to all subscribers of this topic
    apns: {
      payload: {
        aps: {
          sound: "default",
          "content-available": 1, // Enable background processing
        },
      },
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
        priority: "high",
      },
    },
  };

  try {
    const response = await getMessaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
});

// Cloud Function to send notifications every hour (8am-10pm)
exports.sendProductivityReminders = onSchedule("0 8-22 * * *", async (event) => {
  console.log("Sending productivity reminders...");
  
  const message = {
    notification: {
      title: "Time to be productive!",
      body: "Complete your tasks and stay focused!",
    },
    topic: "hourly-notifications",
    apns: {
      payload: {
        aps: {
          sound: "default",
          "content-available": 1,
        },
      },
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
        priority: "high",
      },
    },
  };

  try {
    const response = await getMessaging().send(message);
    console.log("Successfully sent productivity reminder:", response);
    return response;
  } catch (error) {
    console.error("Error sending productivity reminder:", error);
    throw error;
  }
});

// HTTP function to send test notification
exports.sendTestNotification = onRequest(async (req, res) => {
  const {token, title, body} = req.body;
  
  if (!token) {
    return res.status(400).json({error: "Token is required"});
  }

  const message = {
    notification: {
      title: title || "Test Notification",
      body: body || "This is a test notification from Firebase Cloud Functions",
    },
    token: token,
    apns: {
      payload: {
        aps: {
          sound: "default",
          "content-available": 1,
        },
      },
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
        priority: "high",
      },
    },
  };

  try {
    const response = await getMessaging().send(message);
    console.log("Successfully sent test message:", response);
    res.json({success: true, messageId: response});
  } catch (error) {
    console.error("Error sending test message:", error);
    res.status(500).json({error: error.message});
  }
});