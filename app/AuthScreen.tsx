import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const router = useRouter();
  const { user, isLoading, signUp, isDarkMode } = useAuth(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Dynamic styles based on theme
  const themeStyles = {
    container: { backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' },
    text: { color: isDarkMode ? '#FFFFFF' : '#1A442E' },
    inputContainer: { backgroundColor: isDarkMode ? '#1E1E1E' : '#fff', borderColor: isDarkMode ? '#333' : '#ddd' },
    inputText: { color: isDarkMode ? '#fff' : '#000' },
    validationBox: { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF', borderColor: isDarkMode ? '#333' : '#E2E8F0' },
    switchText: { color: isDarkMode ? '#aaa' : '#666' }
  };

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isLoading, user, router]);

  const hasNoSpaces = !password.includes(' ') && password.length > 0;
  const isMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  const isPasswordMatched = !isLogin ? (password === confirmPassword && confirmPassword.length > 0) : true;
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && hasNoSpaces;

  const renderValidationRule = (isValid: boolean, text: string) => (
    <View style={styles.ruleItem} key={text}>
      <Ionicons name={isValid ? "checkmark-circle" : "close-circle"} size={16} color={isValid ? "#2D6A4F" : "#800000"} />
      <Text style={[styles.ruleText, { color: isValid ? "#2D6A4F" : "#800000" }]}>{text}</Text>
    </View>
  );

  const checkInputs = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('Error', 'Please fill up all fields.');
      return false;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      Alert.alert('Error', 'Invalid Email Address format.');
      return false;
    }
    if (!isLogin && !isPasswordValid) {
      Alert.alert('Error', 'Your password is not strong enough.');
      return false;
    }
    if (!isLogin && !isPasswordMatched) {
      Alert.alert('Error', 'Password and Confirm Password do not match.');
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!checkInputs()) return;
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
      } else {
        await signUp(cleanEmail, password);
        Alert.alert('Account Created', 'Check your email for verification.');
      }
    } catch (error: any) {
      Alert.alert('Auth Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push({ pathname: '/forgot-password' } as any);
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <Text style={[styles.title, themeStyles.text]}>{isLogin ? "FairWatt Login" : "Create Account"}</Text>
      <TextInput style={[styles.input, themeStyles.inputContainer, themeStyles.inputText]} placeholder="Email" placeholderTextColor={isDarkMode ? "#aaa" : "#888"} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <View style={[styles.passwordWrapper, themeStyles.inputContainer]}>
        <TextInput style={[styles.passwordInput, themeStyles.inputText]} placeholder="Password" placeholderTextColor={isDarkMode ? 
          "#aaa" : "#888"} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
        <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color={isDarkMode ? "#aaa" : "#1A442E"} />
        </TouchableOpacity>
      </View>
      {!isLogin && password.length > 0 && (
        <View style={[styles.validationBox, themeStyles.validationBox]}>
          <Text style={[styles.validationTitle, { color: isDarkMode ? "#ccc" : "#475569" }]}>Requirements:</Text>
          {renderValidationRule(isMinLength, "8+ characters")}
          {renderValidationRule(hasNoSpaces, "No spaces")}
          {renderValidationRule(hasUppercase, "1 Uppercase")}
          {renderValidationRule(hasLowercase, "1 Lowercase")}
          {renderValidationRule(hasNumber, "1 Number")}
          {renderValidationRule(hasSpecialChar, "1 Special Character")}
        </View>
      )}
      {!isLogin && (
        <>
          <View style={[styles.passwordWrapper, themeStyles.inputContainer, { marginBottom: 5 }]}>
            <TextInput style={[styles.passwordInput, themeStyles.inputText]} placeholder="Confirm Password" placeholderTextColor={isDarkMode ? "#aaa" : "#888"} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
          </View>
          {confirmPassword.length > 0 && (
            <Text style={[styles.matchIndicatorText, { color: isPasswordMatched ? "#2D6A4F" : "#800000" }]}>
              {isPasswordMatched ? "✓ Passwords match" : "✗ Passwords do not match"}
            </Text>
          )}
        </>
      )}
      {isLogin && (
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.mainButton} onPress={handleAuth} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); }}>
        <Text style={[styles.switchText, themeStyles.switchText]}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  passwordWrapper: { flexDirection: 'row', borderRadius: 10, marginBottom: 15, borderWidth: 1, alignItems: 'center' },
  passwordInput: { flex: 1, padding: 15 },
  eyeButton: { paddingHorizontal: 15 },
  validationBox: { padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  validationTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ruleText: { fontSize: 12, marginLeft: 6, fontWeight: '500' },
  matchIndicatorText: { fontSize: 12, fontWeight: '600', marginBottom: 15, paddingLeft: 4 },
  forgotText: { color: '#800000', textAlign: 'right', marginBottom: 20 },
  mainButton: { backgroundColor: '#1A442E', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { marginTop: 20, textAlign: 'center' }
});