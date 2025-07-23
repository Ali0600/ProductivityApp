const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin using environment variable
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Fallback to local file for development
    serviceAccount = require('./firebase-service-account-key.json');
  }
} catch (error) {
  console.error('Error loading Firebase service account:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Store active notification intervals
const activeNotifications = new Map();

// Register FCM token
app.post('/register-token', (req, res) => {
  const { token, userId, intervals } = req.body;
  console.log('Registering token:', token);
  
  // Store token and user preferences
  // In production, you'd save this to a database
  activeNotifications.set(token, {
    userId,
    intervals,
    lastSent: {},
  });
  
  res.json({ success: true, message: 'Token registered successfully' });
});

// Start notifications for specific interval
app.post('/start-notifications', (req, res) => {
  const { token, interval } = req.body;
  console.log(`Starting ${interval} notifications for token:`, token);
  
  const tokenData = activeNotifications.get(token);
  if (tokenData) {
    tokenData.intervals[interval] = true;
    activeNotifications.set(token, tokenData);
    res.json({ success: true, message: `${interval} notifications started` });
  } else {
    res.status(404).json({ success: false, message: 'Token not found' });
  }
});

// Stop notifications for specific interval
app.post('/stop-notifications', (req, res) => {
  const { token, interval } = req.body;
  console.log(`Stopping ${interval} notifications for token:`, token);
  
  const tokenData = activeNotifications.get(token);
  if (tokenData) {
    tokenData.intervals[interval] = false;
    activeNotifications.set(token, tokenData);
    res.json({ success: true, message: `${interval} notifications stopped` });
  } else {
    res.status(404).json({ success: false, message: 'Token not found' });
  }
});

// Send notification function
async function sendNotification(token, title, body, data = {}) {
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: data,
      token: token,
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: title,
              body: body,
            },
            sound: 'default',
            'content-available': 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

// Notification intervals
const intervals = {
  '60s': 60 * 1000,     // 60 seconds
  '10m': 10 * 60 * 1000, // 10 minutes
  '1h': 60 * 60 * 1000,  // 1 hour
};

// Start notification schedulers
Object.keys(intervals).forEach(interval => {
  setInterval(async () => {
    const now = Date.now();
    
    for (const [token, tokenData] of activeNotifications.entries()) {
      if (tokenData.intervals[interval]) {
        const lastSent = tokenData.lastSent[interval] || 0;
        const shouldSend = now - lastSent >= intervals[interval];
        
        if (shouldSend) {
          let title, body;
          
          switch (interval) {
            case '60s':
              title = '60 Second Reminder';
              body = `Quick productivity check! - ${new Date().toLocaleTimeString()}`;
              break;
            case '10m':
              title = 'Productivity Reminder';
              body = `Stay focused and productive! - ${new Date().toLocaleTimeString()}`;
              break;
            case '1h':
              title = '1 Hour Notification';
              body = `Time for a productivity check-in! - ${new Date().toLocaleTimeString()}`;
              break;
          }
          
          const sent = await sendNotification(token, title, body, {
            type: `${interval}_reminder`,
            timestamp: now.toString(),
          });
          
          if (sent) {
            tokenData.lastSent[interval] = now;
            activeNotifications.set(token, tokenData);
            console.log(`Sent ${interval} notification to token:`, token.substring(0, 20) + '...');
          }
        }
      }
    }
  }, 30000); // Check every 30 seconds
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Firebase Notification Server',
    status: 'Running',
    endpoints: {
      health: '/health',
      registerToken: '/register-token (POST)',
      startNotifications: '/start-notifications (POST)',
      stopNotifications: '/stop-notifications (POST)'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    activeTokens: activeNotifications.size,
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Firebase notification server running on port ${PORT}`);
});