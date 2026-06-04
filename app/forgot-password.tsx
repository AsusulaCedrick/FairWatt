import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import EmailSentModal from '../components/EmailSentModal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((seconds) => seconds - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const handleSendRecoveryEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    setError(null);

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('reset-password');
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
      setModalVisible(true);
      setCooldown(45);
    } catch (err: any) {
      setError(err.message || 'Unable to send email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // After closing modal, redirect back to login page
    router.replace('/AuthScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Custom Header with Back Chevron */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/AuthScreen')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1A442E" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Forgot Password</Text>

          {/* Center Illustration - Envelope with Shield/Lock */}
          <View style={styles.illustrationContainer}>
            <View style={styles.circleBg}>
              <Ionicons name="mail" size={64} color="#4CAF50" />
              <View style={styles.lockOverlay}>
                <Ionicons name="lock-closed" size={24} color="#1A442E" />
              </View>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Email Input Field */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#687076" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#687076"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Send Recovery Email Button */}
          <TouchableOpacity
            style={[styles.button, (loading || cooldown > 0) ? styles.buttonDisabled : undefined]}
            onPress={handleSendRecoveryEmail}
            disabled={loading || cooldown > 0}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Recovery Email'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <TouchableOpacity onPress={() => router.replace('/AuthScreen')} style={styles.backLinkContainer}>
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      <EmailSentModal visible={modalVisible} onClose={handleCloseModal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
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
    justifyContent: 'center',
    marginTop: -40, // offset upward slightly for optical balance
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A442E',
    marginBottom: 24,
    textAlign: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  circleBg: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 30,
    right: 32,
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
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
  button: {
    backgroundColor: '#1A442E',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  backLinkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#1A442E',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});