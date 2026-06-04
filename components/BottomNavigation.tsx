import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { navItems } from '../constants/navConfig';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function BottomNavigation() {
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: themeColors.tabIconSelected,
      tabBarInactiveTintColor: themeColors.tabIconDefault,
      tabBarStyle: [styles.tabBar, { backgroundColor: themeColors.card }],
      tabBarLabelStyle: { fontFamily: 'Poppins_500Medium', fontSize: 10 },
      tabBarIcon: ({ color }) => {
        const item = navItems.find((i) => i.name === route.name);
        return item ? <FontAwesome name={item.icon as any} size={20} color={color} /> : null;
      },
    })}>
      {navItems.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { height: 68, paddingTop: 8, paddingBottom: 12, borderTopWidth: 0, elevation: 10 },
});