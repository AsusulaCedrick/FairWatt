import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as Crypto from 'expo-crypto'; // Palitan ang bcrypt ng expo-crypto

export default function OtpVerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return Alert.alert('Error', 'Invalid code length.');

    setLoading(true);
    try {
      // 1. Kunin ang latest na OTP record mula sa database
      const { data, error } = await supabase
        .from('password_resets')
        .select('*')
        .eq('email', email)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) throw new Error("Invalid or expired code.");

      // 2. Check kung expired na (10 minutes)
      if (new Date() > new Date(data.expires_at)) throw new Error("Code expired.");

      // 3. I-hash ang input ng user gamit ang SHA-256 para i-compare sa database
      const hashedInput = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        otp
      );

      // 4. Compare kung tugma ang hash
      if (hashedInput !== data.otp_hash) throw new Error("Incorrect code.");

      // 5. I-mark bilang used ang record
      await supabase.from('password_resets').update({ used: true }).eq('id', data.id);

      Alert.alert('Success', 'Verified!');
      
      // I-pass ang email sa next screen
      router.replace('/reset-password' as any);
      
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
        <TouchableOpacity style={styles.mainButton} onPress={handleVerifyOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 600,
    padding: 20,
    justifyContent: 'center',
  },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, textAlign: 'center', fontSize: 18, borderWidth: 1, borderColor: '#ccc', width: '100%' },
  mainButton: { backgroundColor: '#1A442E', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});