import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { navItems } from '../constants/navConfig';

export default function BottomNavigation() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const config = navItems.find((item) => item.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: '#0052CC',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: styles.tabBar,
          tabBarIcon: ({ color }) =>
            config ? <FontAwesome name={config.icon} size={22} color={color} /> : null,
        };
      }}
    >
      {navItems.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 0,
    elevation: 10,
    backgroundColor: '#FFFFFF',
  },
});
