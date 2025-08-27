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
    "name": "ADHD Habits",
    "slug": "adhd-habits",
    "version": "1.0.19",
    "orientation": "portrait",
    "icon": "./app/assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./app/assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": process.env.APP_VARIANT === "development" ? "com.mhassan0600.adhd-habits.dev" : "com.mhassan0600.adhd-habits",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false,
        "UIBackgroundModes": ["remote-notification"]
      },
      "usesApnsToken": true,
      "entitlements": {
        "aps-environment": process.env.APP_VARIANT === "development" ? "development" : "production"
      },
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./app/assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./app/assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "3301b407-d8a6-4018-bf3c-4f1db722f073"
      }
    },
    "runtimeVersion": {
      "policy": "sdkVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/3301b407-d8a6-4018-bf3c-4f1db722f073"
    },
    "owner": "mhassan0600",
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static",
            "deploymentTarget": "15.1"
          }
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging"
    ]
  }
};