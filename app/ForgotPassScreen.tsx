import React, { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';

export default function ForgotPassScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestOTP = async () => {
    setLoading(true);
    try {
      // 1. Generate 6-digit random code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Hash the OTP using SHA-256 (Compatible with Expo)
      const hashedOtp = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        otp
      );
      
      // 3. Set expiration (10 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      // 4. Save to `password_resets` table
      const { error } = await supabase
        .from('password_resets')
        .insert({
          email: email,
          otp_hash: hashedOtp,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (error) throw error;

      console.log("OTP for testing:", otp); // Check your terminal for this
      Alert.alert("Success", "If this email exists, we sent a code.");
      
      // 5. Navigate to verification screen
      router.push({ 
        pathname: '/OtpVerifyScreen', 
        params: { email: email } 
      });
      
    } catch (err: any) {
      console.error("Error:", err);
      Alert.alert("Error", "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput 
        style={styles.input}
        placeholder="Enter your email" 
        onChangeText={setEmail} 
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button title="Send OTP" onPress={handleRequestOTP} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, padding: 15, marginBottom: 20, borderRadius: 10, borderColor: '#ccc' }
});