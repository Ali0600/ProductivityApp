import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Homepage from './app/screens/Homepage';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppStateProvider } from './app/context/AppStateContext';
import ErrorBoundary from './app/components/ErrorBoundary';

// Global error handlers
const setupGlobalErrorHandlers = () => {
  // Handle JavaScript errors
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Global JavaScript Error:', error);
    console.error('Is Fatal:', isFatal);
    console.error('Error Stack:', error.stack);
    
    // Call original handler
    originalHandler(error, isFatal);
  });

  // Handle unhandled promise rejections
  const previousHandler = global.onunhandledrejection;
  global.onunhandledrejection = (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    console.error('Promise:', event.promise);
    
    if (previousHandler) {
      previousHandler(event);
    }
  };

  // Handle warnings as errors in development
  if (__DEV__) {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && args[0].includes && args[0].includes('Warning:')) {
        console.error('React Warning converted to error for debugging:', ...args);
      }
      originalConsoleWarn(...args);
    };
  }
};

// Setup error handlers immediately
setupGlobalErrorHandlers();

// Add heartbeat logging to track app lifecycle
const startHeartbeat = () => {
  let counter = 0;
  setInterval(() => {
    counter++;
    console.log(`[HEARTBEAT ${counter}] App still running at ${new Date().toISOString()}`);
    
    // Log memory usage if available
    if (global.performance && global.performance.memory) {
      console.log(`[MEMORY] Used: ${Math.round(global.performance.memory.usedJSHeapSize / 1024 / 1024)}MB`);
    }
  }, 10000); // Every 10 seconds
};

export default function App() {
  // Start heartbeat when app loads
  React.useEffect(() => {
    console.log('[APP] App component mounted');
    startHeartbeat();
    
    return () => {
      console.log('[APP] App component unmounted');
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppStateProvider>
          <Homepage/>
        </AppStateProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}