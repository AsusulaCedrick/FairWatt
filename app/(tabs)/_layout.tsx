import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // 🛠️ CHECK: Dahil string[] na ang cast, safe tayo sa TypeScript strict compilation
  const isAuthScreen = (segments as string[]).includes('AuthScreen');

  useEffect(() => {
    if (!isLoading && !user && !isAuthScreen) {
      // 🛠️ FIX: Binago mula `/(tabs)/AuthScreen` patungong `/AuthScreen` 
      // dahil nasa root layer na ng app/ folder ang login screen natin.
      router.replace('/AuthScreen');
    }
  }, [isLoading, user, isAuthScreen, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#1A442E" />
      </View>
    );
  }

  return <BottomNavigation />;
}