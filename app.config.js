const fs = require('fs');
const path = require('path');

// Create GoogleService-Info.plist from environment variable if it exists
if (process.env.GOOGLE_SERVICES_PLIST && !fs.existsSync('./GoogleService-Info.plist')) {
  try {
    const plistContent = Buffer.from(process.env.GOOGLE_SERVICES_PLIST, 'base64').toString();
    fs.writeFileSync('./GoogleService-Info.plist', plistContent);
    console.log('✅ GoogleService-Info.plist created from environment variable');
  } catch (error) {
    console.error('❌ Error creating GoogleService-Info.plist:', error);
  }
}

export default {
  "expo": {
    "name": "ProductivityApp",
    "slug": "productivityapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mhassan0600.adhd-habits",
      "buildNumber": "8",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/messaging"
    ],
    "extra": {
      "eas": {
        "projectId": "0b2cf9e5-67a5-4cc0-9c50-1b51d5c5f16a"
      }
    }
  }
};