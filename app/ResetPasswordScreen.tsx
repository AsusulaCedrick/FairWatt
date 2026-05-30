import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>(); // Dito makukuha ang email
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 📊 Password Complexity Checks
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
      return Alert.alert('Error', 'Please fill in both password fields.');
    }
    if (!isPasswordValid) {
      return Alert.alert('Error', 'Password does not meet complexity requirements.');
    }
    if (!isPasswordMatched) {
      return Alert.alert('Error', 'Passwords do not match.');
    }

    setLoading(true);
    try {
      // 🚀 Using Supabase RPC to update password without being logged in
      const { error } = await supabase.rpc('reset_user_password', { 
        email_address: email, 
        new_password: newPassword 
      });

      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Password</Text>
      <Text style={styles.subtitle}>Set your new secure password.</Text>

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

      {/* Validation Box */}
      {newPassword.length > 0 && (
        <View style={styles.validationBox}>
          <Text style={styles.validationTitle}>Password Requirements:</Text>
          <Text style={{ color: isMinLength ? '#2D6A4F' : '#800000', fontSize: 12 }}>{isMinLength ? '✓' : '✗'} 8+ characters</Text>
          <Text style={{ color: hasNoSpaces ? '#2D6A4F' : '#800000', fontSize: 12 }}>{hasNoSpaces ? '✓' : '✗'} No spaces</Text>
          <Text style={{ color: hasUppercase ? '#2D6A4F' : '#800000', fontSize: 12 }}>{hasUppercase ? '✓' : '✗'} 1 Uppercase</Text>
          <Text style={{ color: hasLowercase ? '#2D6A4F' : '#800000', fontSize: 12 }}>{hasLowercase ? '✓' : '✗'} 1 Lowercase</Text>
          <Text style={{ color: hasNumber ? '#2D6A4F' : '#800000', fontSize: 12 }}>{hasNumber ? '✓' : '✗'} 1 Number</Text>
          <Text style={{ color: hasSpecialChar ? '#2D6A4F' : '#800000', fontSize: 12 }}>{hasSpecialChar ? '✓' : '✗'} 1 Special char</Text>
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

      <TouchableOpacity style={styles.mainButton} onPress={handleUpdatePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A442E', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 30 },
  passwordWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  passwordInput: { flex: 1, padding: 15 },
  eyeButton: { paddingHorizontal: 15 },
  validationBox: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  validationTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
  mainButton: { backgroundColor: '#1A442E', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});