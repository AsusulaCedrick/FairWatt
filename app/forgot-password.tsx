import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((seconds) => seconds - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cooldown]);

  const validateEmail = (value: string) => value.trim().length > 0 && EMAIL_REGEX.test(value.trim());

  const handleSendRecoveryEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    setStatusMessage(null);
    setError(null);

    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (loading || cooldown > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: 'fairwatt://reset-password',
      });

      if (error) throw error;

      setStatusMessage('Recovery email sent. Check your inbox.');
      setCooldown(45);
    } catch (err: any) {
      console.error('Recovery request failed:', err);
      setError('Unable to send recovery email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive a secure recovery link.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setError(null);
          setStatusMessage(null);
        }}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {statusMessage ? <Text style={styles.successText}>{statusMessage}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (loading || cooldown > 0) ? styles.buttonDisabled : undefined]}
        onPress={handleSendRecoveryEmail}
        disabled={loading || cooldown > 0}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Recovery Email'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/AuthScreen')}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A442E', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#475569', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 12 },
  button: { backgroundColor: '#1A442E', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backText: { color: '#1A442E', textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
  errorText: { color: '#9B1C1C', marginBottom: 8, textAlign: 'center' },
  successText: { color: '#166534', marginBottom: 8, textAlign: 'center' },
});