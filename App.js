import { StyleSheet, Text, View } from 'react-native';
import Homepage from './app/screens/Homepage';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppStateProvider } from './app/context/AppStateContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppStateProvider>
        <Homepage/>
      </AppStateProvider>
    </GestureHandlerRootView>
  );
}