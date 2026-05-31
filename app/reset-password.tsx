import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ResetParams {
  access_token?: string;
  refresh_token?: string;
  type?: string;
  error_description?: string;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ResetParams>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [canReset, setCanReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (params.error_description) {
        setTokenError('The reset link is invalid or expired. Request a new recovery email.');
        setLinkLoading(false);
        return;
      }

      if (!params.access_token || params.type !== 'recovery') {
        setTokenError('Unable to verify the recovery link. Open the link from your email again.');
        setLinkLoading(false);
        return;
      }

      try {
        const sessionPayload: any = { access_token: params.access_token as string };
        if (params.refresh_token) {
          sessionPayload.refresh_token = params.refresh_token as string;
        }

        const { error } = await supabase.auth.setSession(sessionPayload);
        if (error) throw error;

        setCanReset(true);
      } catch (err: any) {
        console.error('Password recovery session error:', err);
        setTokenError('The link is invalid or has expired. Request a new recovery email.');
      } finally {
        setLinkLoading(false);
      }
    };

    init();
  }, [params]);

  const hasNoSpaces = !newPassword.includes(' ') && newPassword.length > 0;
  const isMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*]/.test(newPassword);
  const isPasswordMatched = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasNoSpaces;

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      return Alert.alert('Error', 'Please fill out both password fields.');
    }
    if (!isPasswordValid) {
      return Alert.alert('Error', 'Password must meet the requirements.');
    }
    if (!isPasswordMatched) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
    if (!canReset) {
      return Alert.alert('Error', 'Recovery link not verified. Please open the email link again.');
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully. Please login with your new password.', [
        {
          text: 'OK',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/AuthScreen');
          },
        },
      ]);

      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password update failure:', err);
      Alert.alert('Error', 'Unable to update password. Please try again or request a new recovery link.');
    } finally {
      setLoading(false);
    }
  };

  if (linkLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A442E" />
        <Text style={styles.statusText}>Validating recovery link...</Text>
      </View>
    );
  }

  if (tokenError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.errorText}>{tokenError}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/forgot-password')}>
          <Text style={styles.secondaryText}>Request a new recovery email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Set a strong new password for your account.</Text>

      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#1A442E" />
        </TouchableOpacity>
      </View>

      {newPassword.length > 0 && (
        <View style={styles.validationBox}>
          <Text style={styles.validationTitle}>Password Requirements:</Text>
          <Text style={[styles.ruleText, { color: isMinLength ? '#2D6A4F' : '#9B1C1C' }]}>{isMinLength ? '✓' : '✗'} 8+ characters</Text>
          <Text style={[styles.ruleText, { color: hasNoSpaces ? '#2D6A4F' : '#9B1C1C' }]}>{hasNoSpaces ? '✓' : '✗'} No spaces</Text>
          <Text style={[styles.ruleText, { color: hasUppercase ? '#2D6A4F' : '#9B1C1C' }]}>{hasUppercase ? '✓' : '✗'} 1 Uppercase</Text>
          <Text style={[styles.ruleText, { color: hasLowercase ? '#2D6A4F' : '#9B1C1C' }]}>{hasLowercase ? '✓' : '✗'} 1 Lowercase</Text>
          <Text style={[styles.ruleText, { color: hasNumber ? '#2D6A4F' : '#9B1C1C' }]}>{hasNumber ? '✓' : '✗'} 1 Number</Text>
          <Text style={[styles.ruleText, { color: hasSpecialChar ? '#2D6A4F' : '#9B1C1C' }]}>{hasSpecialChar ? '✓' : '✗'} 1 Special character</Text>
        </View>
      )}

      <View style={styles.passwordWrapper}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
      </View>

      {confirmPassword.length > 0 ? (
        <Text style={[styles.matchText, { color: isPasswordMatched ? '#2D6A4F' : '#9B1C1C' }]}>
          {isPasswordMatched ? 'Passwords match' : 'Passwords do not match'}
        </Text>
      ) : null}

      <TouchableOpacity style={styles.mainButton} onPress={handleUpdatePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A442E', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 24 },
  passwordWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', marginBottom: 15 },
  passwordInput: { flex: 1, padding: 16 },
  eyeButton: { paddingHorizontal: 14 },
  validationBox: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  validationTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  ruleText: { fontSize: 12, marginBottom: 4 },
  matchText: { textAlign: 'left', marginBottom: 12, fontWeight: '600' },
  mainButton: { backgroundColor: '#1A442E', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { marginTop: 20, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#E2E8F0' },
  secondaryText: { color: '#1A442E', fontWeight: '600' },
  errorText: { color: '#9B1C1C', textAlign: 'center', marginBottom: 12 },
  statusText: { color: '#475569', textAlign: 'center', marginTop: 16 },
});