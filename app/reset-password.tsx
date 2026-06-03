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
  const params = useLocalSearchParams() as ResetParams;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Dito natin chine-check yung link na galing sa email
      if (params.error_description || !params.access_token || params.type !== 'recovery') {
        Alert.alert('Error', 'Invalid or expired link. Please request a new one.');
        router.replace('/forgot-password');
        return;
      }

      try {
        // Ina-apply ang session gamit ang token mula sa link
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token!,
          refresh_token: params.refresh_token!,
        });

        if (error) throw error;
      } catch (err) {
        Alert.alert('Error', 'Failed to verify link.');
        router.replace('/forgot-password');
      } finally {
        setLinkLoading(false);
      }
    };

    init();
  }, [params]);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match.');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // SUCCESS: Ibabalik sa login page (AuthScreen)
      Alert.alert('Success', 'Password updated! Please log in.', [
        { text: 'OK', onPress: () => router.replace('/AuthScreen') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (linkLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A442E" />
        <Text style={{ textAlign: 'center', marginTop: 10 }}>Verifying link...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      
      <View style={styles.inputWrapper}>
        <TextInput 
          style={styles.input} 
          placeholder="New Password" 
          value={newPassword} 
          onChangeText={setNewPassword} 
          secureTextEntry={!showPassword} 
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#1A442E" />
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.input} 
        placeholder="Confirm Password" 
        value={confirmPassword} 
        onChangeText={setConfirmPassword} 
        secureTextEntry={!showPassword} 
      />

      <TouchableOpacity style={styles.button} onPress={handleUpdatePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F5F7FA' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A442E', marginBottom: 20, textAlign: 'center' },
  inputWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', padding: 16, marginBottom: 12, alignItems: 'center' },
  input: { flex: 1 },
  button: { backgroundColor: '#1A442E', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});