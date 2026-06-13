import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Colors, Fonts, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { SuccessModal } from '../components/ui/SuccessModal';
import { ErrorModal } from '../components/ui/ErrorModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDarkMode } = useAuth();
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((seconds) => seconds - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const handleSendPress = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSendRecoveryEmail = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const redirectUrl = Linking.createURL('reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      setShowSuccessModal(true);
      setCooldown(45);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send email. Please try again.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.replace('/AuthScreen');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Custom Header with Back Chevron */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/AuthScreen')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={themeColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.webContainer}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: themeColors.primary }]}>Forgot Password</Text>

            {/* Center Illustration - Envelope with Shield/Lock */}
            <View style={styles.illustrationContainer}>
              <View style={[styles.circleBg, { backgroundColor: isDarkMode ? '#1B3A2E' : '#E8F5E9' }]}>
                <Ionicons name="mail" size={64} color={isDarkMode ? '#81C784' : '#4CAF50'} />
                <View style={[styles.lockOverlay, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                  <Ionicons name="lock-closed" size={20} color={themeColors.primary} />
                </View>
              </View>
            </View>

            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            {/* Email Input Field */}
            <Input
              label="Email address"
              placeholder="Enter your email"
              keyboardType="email-address"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
            />

            {/* Send Recovery Email Button */}
            <Button
              title={cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Recovery Email'}
              onPress={handleSendPress}
              disabled={loading || cooldown > 0}
              loading={loading}
              style={styles.button}
            />

            {/* Back to Login Link */}
            <TouchableOpacity onPress={() => router.replace('/AuthScreen')} style={styles.backLinkContainer}>
              <Text style={[styles.backLinkText, { color: themeColors.primary }]}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationModal
        visible={showConfirmModal}
        title="Send recovery email?"
        message="Continue recovery process?"
        confirmText="Continue"
        iconName="mail-unread"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={executeSendRecoveryEmail}
      />

      {/* --- SUCCESS MODAL --- */}
      <SuccessModal
        visible={showSuccessModal}
        title="Email Verification Sent"
        message="We've sent a password reset link to your email."
        onConfirm={handleCloseSuccessModal}
      />

      {/* --- ERROR MODAL --- */}
      <ErrorModal
        visible={showErrorModal}
        title="Verification Failed"
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
  headerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  },
  webContainer: {
    width: '100%',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 24,
    justifyContent: 'center',
    marginTop: -40, // offset upward slightly for optical balance
  },
  title: {
    ...Fonts.h1,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  circleBg: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 14,
    borderWidth: 1.5,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subtitle: {
    ...Fonts.body,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  button: {
    marginTop: 8,
  },
  backLinkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  backLinkText: {
    ...Fonts.body,
    fontWeight: '700',
  },
});