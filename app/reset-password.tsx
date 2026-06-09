import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { DEV_MODE } from '../config/dev';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Radius } from '../constants/theme';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { SuccessModal } from '../components/ui/SuccessModal';
import { ErrorModal } from '../components/ui/ErrorModal';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, signOut, clearResetting, isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(true);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Prevent infinite loading if opened manually - set to 60 seconds (1 minute)
    const timeoutTimer = setTimeout(() => {
      if (linkLoading && !DEV_MODE) {
        setErrorMessage('Invalid or expired recovery link. Please request a new one.');
        setShowErrorModal(true);
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

  const handleUpdatePress = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    
    if (!passwordRegex.test(newPassword) || newPassword.includes(' ')) {
      setErrorMessage('Password does not meet all security requirements.');
      setShowErrorModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setShowErrorModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  const executeUpdatePassword = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      clearResetting();
      await signOut();
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const renderValidationRule = (isValid: boolean, text: string) => (
    <View style={styles.ruleItem} key={text}>
      <Ionicons
        name={isValid ? 'checkmark-circle' : 'checkmark-circle-outline'}
        size={18}
        color={isValid ? themeColors.success : (isDarkMode ? '#37474F' : '#B0BEC5')}
        style={styles.ruleIcon}
      />
      <Text style={[styles.ruleText, { color: isValid ? themeColors.text : themeColors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );

  if (linkLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={[styles.loadingText, { color: themeColors.primary }]}>Verifying link...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Custom Header with Back Chevron */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/forgot-password')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={themeColors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Centered FairWatt Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoIconBg, { backgroundColor: isDarkMode ? '#1B3A2E' : '#E8F5E9' }]}>
              <Ionicons name="flash" size={40} color={isDarkMode ? '#81C784' : '#1B5E20'} />
            </View>
          </View>

          <Text style={[styles.title, { color: themeColors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Create a new password for your account.{"\n"}Make sure it's strong and secure.
          </Text>

          {/* New Password Input Field */}
          <Input
            label="New Password"
            placeholder="Enter new password"
            secureTextEntry
            leftIcon="lock-closed-outline"
            value={newPassword}
            onChangeText={setNewPassword}
          />

          {/* Real-time Validation Checklist */}
          {newPassword.length > 0 && (
            <View style={[styles.checklistContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.checklistTitle, { color: themeColors.text }]}>Requirements:</Text>
              {renderValidationRule(isMinLength, 'At least 8 characters')}
              {renderValidationRule(hasUppercase, 'At least 1 uppercase letter (A-Z)')}
              {renderValidationRule(hasLowercase, 'At least 1 lowercase letter (a-z)')}
              {renderValidationRule(hasNumber, 'At least 1 number (0-9)')}
              {renderValidationRule(hasSpecialChar, 'At least 1 special character (!@#$%^&*)')}
              {renderValidationRule(hasNoSpaces, 'No spaces allowed')}
            </View>
          )}

          {/* Confirm Password Input Field */}
          <Input
            label="Confirm New Password"
            placeholder="Confirm new password"
            secureTextEntry
            leftIcon="lock-closed-outline"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {confirmPassword.length > 0 && (
            <View style={styles.matchContainer}>
              <Text style={[styles.matchText, { color: isConfirmMatch ? themeColors.success : themeColors.error }]}>
                {isConfirmMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </Text>
            </View>
          )}

          {/* Reset Password Button */}
          <Button
            title="Reset Password"
            onPress={handleUpdatePress}
            disabled={!isPasswordValid || !isConfirmMatch || loading}
            loading={loading}
            iconName="lock-closed-outline"
            style={styles.button}
          />

          {/* Divider style */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <Text style={[styles.dividerText, { color: themeColors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
          </View>

          {/* Switching redirect */}
          <TouchableOpacity 
            onPress={() => router.replace('/AuthScreen')}
            style={styles.switchContainer}
          >
            <Text style={[styles.switchText, { color: themeColors.textSecondary }]}>
              Remember your password?{' '}
              <Text style={{ color: themeColors.primary, fontWeight: '700' }}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationModal
        visible={showConfirmModal}
        title="Reset Password?"
        message={`You are about to change your account password.\n\nDo you want to continue?`}
        confirmText="Continue"
        cancelText="Cancel"
        iconName="help-circle-outline"
        iconColor={themeColors.primary}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={executeUpdatePassword}
      />

      {/* --- SUCCESS MODAL --- */}
      <SuccessModal
        visible={showSuccessModal}
        title="Password Reset Successful!"
        message={`Your password has been updated successfully.\n\nYou can now log in using your new password.`}
        confirmText="Go to Login"
        onConfirm={() => {
          setShowSuccessModal(false);
          router.replace('/AuthScreen');
        }}
      />

      {/* --- ERROR MODAL --- */}
      <ErrorModal
        visible={showErrorModal}
        title="Error"
        message={errorMessage}
        onConfirm={() => {
          setShowErrorModal(false);
          if (errorMessage.includes('Invalid or expired recovery link')) {
            router.replace('/forgot-password');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Fonts.h1,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Fonts.body,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  checklistContainer: {
    marginBottom: 20,
    borderRadius: Radius.input,
    padding: 16,
    borderWidth: 1,
  },
  checklistTitle: {
    ...Fonts.caption,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ruleIcon: {
    marginRight: 8,
  },
  ruleText: {
    ...Fonts.caption,
    fontWeight: '500',
  },
  matchContainer: {
    marginTop: -8,
    marginBottom: 16,
    paddingLeft: 4,
  },
  matchText: {
    ...Fonts.caption,
    fontWeight: '600',
    fontSize: 13,
  },
  button: {
    marginTop: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    ...Fonts.body,
    fontWeight: '500',
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  switchText: {
    ...Fonts.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    ...Fonts.body,
    fontWeight: '500',
  },
});