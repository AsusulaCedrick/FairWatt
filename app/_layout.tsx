import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '../context/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Ginawa nating hiwalay na component ang RootLayoutContent para ma-access ang useAuth()
function RootLayoutContent() {
  const { isDarkMode } = useAuth();

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Main App Navigation Interface Group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Main Tenant Login & Registration Screening Section */}
        <Stack.Screen name="AuthScreen" options={{ headerShown: false }} />

        {/* Password Recovery Screens */}
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        
        {/* Global Pop-up Overlays */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}