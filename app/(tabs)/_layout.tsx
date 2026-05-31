import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user, isLoading, isDarkMode } = useAuth(); // Idinagdag ang isDarkMode
  const router = useRouter();
  const segments = useSegments();

  const isAuthScreen = (segments as string[]).includes('AuthScreen');

  useEffect(() => {
    if (!isLoading && !user && !isAuthScreen) {
      router.replace('/AuthScreen');
    }
  }, [isLoading, user, isAuthScreen, router]);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' // Dynamic background
      }}>
        <ActivityIndicator 
          size="large" 
          color={isDarkMode ? '#FFFFFF' : '#1A442E'} // Dynamic loader color
        />
      </View>
    );
  }

  return <BottomNavigation />;
}