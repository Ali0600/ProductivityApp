import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import Homepage from './app/screens/Homepage';
import TileGrid from './app/screens/TileGrid';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppStateProvider } from './app/context/AppStateContext';
import { useMainLists } from './app/hooks/useAppState';
import NotificationService from './app/services/notificationService';
import { useEffect } from 'react';

function RootScreen() {
  const { currentMainList } = useMainLists();
  return currentMainList ? <Homepage /> : <TileGrid />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...AntDesign.font,
    ...Feather.font,
    ...Entypo.font,
  });

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🔔 APP.JS: Starting notification initialization...');
        const token = await NotificationService.registerForPushNotificationsAsync();
        await NotificationService.initializeBackgroundNotifications();

        const notificationsEnabled = await NotificationService.getNotificationsEnabled();
        if (notificationsEnabled) {
          await NotificationService.scheduleRecurringNotifications();
          console.log('🔔 APP.JS: Scheduled recurring notifications');
        } else {
          console.log('🔔 APP.JS: Notifications disabled by user, skipping schedule');
        }
      } catch (error) {
        console.error('🔔 APP.JS: Error in notification setup:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        style={{ flex: 1 }}
        colors={['#1a1a3a', '#0f0f24', '#070712', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBar style="light" />
        {fontsLoaded && (
          <AppStateProvider>
            <RootScreen />
          </AppStateProvider>
        )}
      </LinearGradient>
    </GestureHandlerRootView>
  );
}
