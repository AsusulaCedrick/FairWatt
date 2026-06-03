import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

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
    return () => { if (interval) clearInterval(interval); };
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
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: 'fairwatt://reset-password',
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
        onChangeText={setEmail}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (loading || cooldown > 0) ? styles.buttonDisabled : undefined]}
        onPress={handleSendRecoveryEmail}
        disabled={loading || cooldown > 0}
      >
        {loading ? <ActivityIndicator color="#fff" /> : 
         <Text style={styles.buttonText}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Recovery Email'}</Text>}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Check your email!</Text>
            <Text style={styles.modalSubtitle}>A password recovery link has been sent to your inbox.</Text>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  button: { backgroundColor: '#1A442E', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backText: { color: '#1A442E', textAlign: 'center', marginTop: 16, textDecorationLine: 'underline' },
  errorText: { color: '#9B1C1C', marginBottom: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A442E', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20 },
});