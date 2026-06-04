import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch, SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Radius } from '../../constants/theme';
import { Spacing } from '../../constants/Spacing';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { SuccessModal } from '../../components/ui/SuccessModal';
import { ErrorModal } from '../../components/ui/ErrorModal';

export default function ProfileScreen() {
  const { user, isDarkMode, toggleTheme } = useAuth();
  const router = useRouter();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // Modals state
  const [showConfirmUpload, setShowConfirmUpload] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [showConfirmTheme, setShowConfirmTheme] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const displayName = user?.email ? user.email.split('@')[0] : "User";

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setErrorMessage("We need access to your photos to change your profile picture.");
      setShowErrorModal(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPendingImage(result.assets[0].uri);
      setShowConfirmUpload(true);
    }
  };

  const handleConfirmUpload = () => {
    setShowConfirmUpload(false);
    if (pendingImage) {
      setProfileImage(pendingImage);
      setSuccessMessage('Profile picture updated successfully!');
      setShowSuccessModal(true);
    }
  };

  const handleConfirmLogout = async () => {
    setShowConfirmLogout(false);
    try {
      await supabase.auth.signOut();
      router.replace('/AuthScreen');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to logout.');
      setShowErrorModal(true);
    }
  };

  const handleConfirmTheme = () => {
    setShowConfirmTheme(false);
    toggleTheme();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          {/* Avatar container */}
          <TouchableOpacity 
            style={[styles.avatarContainer, { backgroundColor: isDarkMode ? '#333333' : '#DDE6E2', borderColor: themeColors.border }]} 
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={50} color={isDarkMode ? "#FFFFFF" : "#1B5E20"} />
            )}
            <View style={[styles.editIcon, { backgroundColor: themeColors.primary, borderColor: themeColors.background }]}>
              <Ionicons name="pencil" size={14} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.name, { color: themeColors.primary }]}>
            {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
          </Text>
          <Text style={[styles.email, { color: themeColors.textSecondary }]}>{user?.email}</Text>
        </View>

        <View style={styles.settingsContainer}>
          <View style={[styles.settingItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? '#1B3A2E' : '#E8F5E9' }]}>
                <Ionicons name="moon-outline" size={22} color={themeColors.primary} />
              </View>
              <Text style={[styles.settingText, { color: themeColors.text }]}>Dark Mode</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={() => setShowConfirmTheme(true)} 
              trackColor={{ true: themeColors.primary, false: isDarkMode ? '#334155' : '#ccc' }} 
              thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            />
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]} 
            onPress={() => setShowConfirmLogout(true)}
            activeOpacity={0.8}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? '#3A1E1E' : '#FDE8E8' }]}>
                <Ionicons name="log-out-outline" size={22} color={themeColors.error} />
              </View>
              <Text style={[styles.logoutText, { color: themeColors.error }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- CONFIRM UPLOAD IMAGE MODAL --- */}
      <ConfirmationModal
        visible={showConfirmUpload}
        title="Upload image?"
        message="Continue upload?"
        confirmText="Upload"
        iconName="image"
        onCancel={() => setShowConfirmUpload(false)}
        onConfirm={handleConfirmUpload}
      />

      {/* --- CONFIRM LOGOUT MODAL --- */}
      <ConfirmationModal
        visible={showConfirmLogout}
        title="Logout account?"
        message="Are you sure?"
        confirmText="Logout"
        iconName="log-out"
        isDestructive
        onCancel={() => setShowConfirmLogout(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* --- CONFIRM THEME TOGGLE MODAL --- */}
      <ConfirmationModal
        visible={showConfirmTheme}
        title={isDarkMode ? "Disable Dark Mode?" : "Enable Dark Mode?"}
        message="Change appearance mode?"
        confirmText="Confirm"
        iconName="color-filter"
        onCancel={() => setShowConfirmTheme(false)}
        onConfirm={handleConfirmTheme}
      />

      {/* --- SUCCESS MODAL --- */}
      <SuccessModal
        visible={showSuccessModal}
        title="Success"
        message={successMessage}
        onConfirm={() => setShowSuccessModal(false)}
      />

      {/* --- ERROR MODAL --- */}
      <ErrorModal
        visible={showErrorModal}
        title="Action Failed"
        message={errorMessage}
        onConfirm={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: { 
    alignItems: 'center', 
    marginTop: 50, 
    marginBottom: 32,
  },
  avatarContainer: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    borderWidth: 2,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16, 
    position: 'relative',
  },
  avatar: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 55,
  },
  editIcon: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    padding: 6, 
    borderRadius: 15, 
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { 
    ...Fonts.h2,
    fontWeight: '800', 
  },
  email: { 
    ...Fonts.body,
    marginTop: 4, 
  },
  settingsContainer: { 
    paddingHorizontal: 20,
  },
  settingItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16, 
    borderRadius: Radius.card - 4, 
    marginBottom: 16,
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  settingText: { 
    ...Fonts.body,
    fontWeight: '600',
    marginLeft: 14, 
  },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 16, 
    borderRadius: Radius.card - 4,
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  logoutText: { 
    ...Fonts.body,
    fontWeight: '700', 
    marginLeft: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
});