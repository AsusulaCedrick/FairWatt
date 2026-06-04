import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { DEV_MODE } from '../config/dev';
import { useAuth } from '../context/AuthContext';

interface ResetParams {
  access_token?: string;
  refresh_token?: string;
  type?: string;
  error_description?: string;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as ResetParams;
  const url = Linking.useURL();
  const { user, signOut, clearResetting } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Prevent infinite loading if opened manually - set to 60 seconds (1 minute)
    const timeoutTimer = setTimeout(() => {
      if (linkLoading && !DEV_MODE) {
        Alert.alert('Error', 'Invalid or expired recovery link. Please request a new one.');
        router.replace('/forgot-password');
      }
    }, 60000);

    return () => clearTimeout(timeoutTimer);
  }, [linkLoading]);

  useEffect(() => {
    const init = () => {
      if (DEV_MODE) {
        setLinkLoading(false);
        return;
      }

      // If user is set, it means the root-level deep link handler has verified the link and authenticated us!
      if (user) {
        console.log('Reset Password: User authenticated via deep link session.');
        setLinkLoading(false);
      }
    };

    init();
  }, [user]);

  // Validation criteria
  const isMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);
  const hasNoSpaces = !newPassword.includes(' ') && newPassword.length > 0;

  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasNoSpaces;
  const isConfirmMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleUpdatePassword = async () => {
    // Regex from image notes
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    
    if (!passwordRegex.test(newPassword) || newPassword.includes(' ')) {
      Alert.alert('Validation Error', 'Password does not meet all security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      clearResetting();
      await signOut();

      Alert.alert('Success', 'Password updated successfully! Please log in.', [
        { text: 'OK', onPress: () => router.replace('/AuthScreen') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const renderValidationRule = (isValid: boolean, text: string) => (
    <View style={styles.ruleItem} key={text}>
      <Ionicons
        name={isValid ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={isValid ? '#2D6A4F' : '#9BA1A6'}
      />
      <Text style={[styles.ruleText, { color: isValid ? '#2D6A4F' : '#687076' }]}>
        {text}
      </Text>
    </View>
  );

  if (linkLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A442E" />
        <Text style={styles.loadingText}>Verifying link...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Custom Header with Back Chevron */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/forgot-password')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1A442E" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your new password below.</Text>

          {/* New Password Input Field */}
          <Text style={styles.inputLabel}>New Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#687076" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#687076"
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
              <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#687076" />
            </TouchableOpacity>
          </View>

          {/* Real-time Validation Checklist */}
          <View style={styles.checklistContainer}>
            {renderValidationRule(isMinLength, 'At least 8 characters')}
            {renderValidationRule(hasUppercase, 'At least 1 uppercase letter (A-Z)')}
            {renderValidationRule(hasLowercase, 'At least 1 lowercase letter (a-z)')}
            {renderValidationRule(hasNumber, 'At least 1 number (0-9)')}
            {renderValidationRule(hasSpecialChar, 'At least 1 special character (!@#$%^&*)')}
            {renderValidationRule(hasNoSpaces, 'No spaces allowed')}
          </View>

          {/* Confirm Password Input Field */}
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#687076" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#687076"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#687076" />
            </TouchableOpacity>
          </View>

          {confirmPassword.length > 0 && (
            <Text style={[styles.matchText, { color: isConfirmMatch ? '#2D6A4F' : '#D32F2F' }]}>
              {isConfirmMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </Text>
          )}

          {/* Reset Password Button */}
          <TouchableOpacity
            style={[styles.button, (!isPasswordValid || !isConfirmMatch || loading) ? styles.buttonDisabled : undefined]}
            onPress={handleUpdatePassword}
            disabled={!isPasswordValid || !isConfirmMatch || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A442E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#687076',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A442E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#11181C',
  },
  eyeIcon: {
    padding: 4,
  },
  checklistContainer: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 13,
    marginLeft: 10,
    fontWeight: '500',
  },
  matchText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 4,
  },
  button: {
    backgroundColor: '#1A442E',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1A442E',
    fontWeight: '500',
  },
});