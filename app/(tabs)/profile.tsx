import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Switch, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, isDarkMode, toggleTheme } = useAuth();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const displayName = user?.email ? user.email.split('@')[0] : "User";

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "We need access to your photos to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/AuthScreen');
      }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' }]}>
      <View style={styles.profileHeader}>
        <TouchableOpacity 
          style={[styles.avatarContainer, { backgroundColor: isDarkMode ? '#333' : '#DDE6E2' }]} 
          onPress={pickImage}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Ionicons name="person" size={50} color={isDarkMode ? "#fff" : "#1A442E"} />
          )}
          {/* MODIFIED: Dynamic border color para sa edit icon */}
          <View style={[styles.editIcon, { borderColor: isDarkMode ? '#121212' : '#fff' }]}>
            <Ionicons name="pencil" size={16} color="white" />
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.name, { color: isDarkMode ? '#fff' : '#1A442E' }]}>
          {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
        </Text>
        <Text style={[styles.email, { color: isDarkMode ? '#aaa' : '#666' }]}>{user?.email}</Text>
      </View>

      <View style={styles.settingsContainer}>
        <View style={[styles.settingItem, { backgroundColor: isDarkMode ? '#1E1E1E' : '#fff' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="moon-outline" size={24} color={isDarkMode ? "#fff" : "#333"} />
            <Text style={[styles.settingText, { color: isDarkMode ? '#fff' : '#333' }]}>Dark Mode</Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={toggleTheme} 
            trackColor={{ true: '#1A442E', false: '#ccc' }} 
          />
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: isDarkMode ? '#1E1E1E' : '#fff' }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#E76F51" />
          <Text style={[styles.logoutText, { color: isDarkMode ? '#ff856a' : '#E76F51' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileHeader: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatarContainer: { 
    width: 100, height: 100, borderRadius: 50, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  editIcon: { 
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1A442E', 
    padding: 5, borderRadius: 15, borderWidth: 2
  },
  name: { fontSize: 22, fontWeight: 'bold' },
  email: { fontSize: 14, marginTop: 5 },
  settingsContainer: { paddingHorizontal: 20 },
  settingItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderRadius: 15, marginBottom: 15
  },
  settingText: { fontSize: 16, marginLeft: 15 },
  logoutButton: { 
    flexDirection: 'row', alignItems: 'center', 
    padding: 20, borderRadius: 15 
  },
  logoutText: { fontSize: 16, marginLeft: 15, fontWeight: '600' }
});