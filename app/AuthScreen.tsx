import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { ErrorModal } from '../components/ui/ErrorModal';
import { Input } from '../components/ui/Input';
import { SuccessModal } from '../components/ui/SuccessModal';
import { Colors, Fonts, Radius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const screenWidth = Dimensions.get('window').width;

export default function AuthScreen() {
  const router = useRouter();
  const { user, isLoading, signUp, isDarkMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Added field for full name as per spec
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal State Variables
  const [showConfirmLogin, setShowConfirmLogin] = useState(false);
  const [showConfirmSignUp, setShowConfirmSignUp] = useState(false);
  const [showSuccessLogin, setShowSuccessLogin] = useState(false);
  const [showSuccessSignUp, setShowSuccessSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  // Password rules validation
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
      <Ionicons
        name={isValid ? "checkmark-circle" : "close-circle"}
        size={16}
        color={isValid ? themeColors.success : themeColors.error}
      />
      <Text style={[styles.ruleText, { color: isValid ? themeColors.success : themeColors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );

  const checkInputs = () => {
    const cleanEmail = email.trim();
    if (isLogin) {
      if (!cleanEmail || !password) {
        setErrorMessage('Please fill up all fields.');
        setShowErrorModal(true);
        return false;
      }
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMessage('Invalid Email Address format.');
        setShowErrorModal(true);
        return false;
      }
    } else {
      if (!fullName.trim() || !cleanEmail || !password || !confirmPassword) {
        setErrorMessage('Please fill up all fields.');
        setShowErrorModal(true);
        return false;
      }
      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMessage('Invalid Email Address format.');
        setShowErrorModal(true);
        return false;
      }
      if (!isPasswordValid) {
        setErrorMessage('Your password is not strong enough.');
        setShowErrorModal(true);
        return false;
      }
      if (!isPasswordMatched) {
        setErrorMessage('Password and Confirm Password do not match.');
        setShowErrorModal(true);
        return false;
      }
    }
    return true;
  };

  // Triggers Confirmation Modals instead of direct execution
  const handleAuthPress = () => {
    if (!checkInputs()) return;
    if (isLogin) {
      setShowConfirmLogin(true);
    } else {
      setShowConfirmSignUp(true);
    }
  };

  // Actual Login operation called after confirmation
  const executeLogin = async () => {
    setShowConfirmLogin(false);
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;

      // Show success modal
      setShowSuccessLogin(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to login.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Actual Registration operation called after confirmation
  const executeSignUp = async () => {
    setShowConfirmSignUp(false);
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      await signUp(cleanEmail, password);
      // Show success modal
      setShowSuccessSignUp(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create account.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <ScrollView
      style={{ backgroundColor: themeColors.background }}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          {/* FairWatt Logo and Branding */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoIconBg, { backgroundColor: isDarkMode ? '#1B3A2E' : '#E8F5E9' }]}>
              <Ionicons name="flash" size={40} color={isDarkMode ? '#81C784' : '#1B5E20'} />
            </View>
            <Text style={[styles.logoText, { color: themeColors.primary }]}>FairWatt</Text>
            <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
              {isLogin ? "Welcome Back!" : "Create Account"}
            </Text>
            <Text style={[styles.tagline, { color: themeColors.textSecondary }]}>
              {isLogin ? "Sign in to continue tracking energy." : "Sign up to get started with FairWatt."}
            </Text>
          </View>

          {/* Form Card Layout */}
          <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>

            {!isLogin && (
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                leftIcon="person-outline"
              />
            )}

            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              leftIcon="mail-outline"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />
            )}

            {/* Validation Checklist on Sign Up */}
            {!isLogin && password.length > 0 && (
              <View style={[styles.checklistCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF', borderColor: themeColors.border }]}>
                <Text style={[styles.checklistTitle, { color: themeColors.text }]}>Requirements:</Text>
                {renderValidationRule(isMinLength, "At least 8 characters")}
                {renderValidationRule(hasNoSpaces, "No spaces allowed")}
                {renderValidationRule(hasUppercase, "At least 1 uppercase letter (A-Z)")}
                {renderValidationRule(hasLowercase, "At least 1 lowercase letter (a-z)")}
                {renderValidationRule(hasNumber, "At least 1 number (0-9)")}
                {renderValidationRule(hasSpecialChar, "At least 1 special character (!@#$%^&*)")}
              </View>
            )}

            {isLogin && (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotContainer}>
                <Text style={[styles.forgotText, { color: themeColors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <Button
              title={isLogin ? "Login" : "Sign Up"}
              onPress={handleAuthPress}
              loading={loading}
              style={styles.mainButton}
            />

            {/* Divider style */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
              <Text style={[styles.dividerText, { color: themeColors.textSecondary }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            </View>



            {/* Switching redirect */}
            <TouchableOpacity
              onPress={() => { setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); setEmail(''); setFullName(''); }}
              style={styles.switchContainer}
            >
              <Text style={[styles.switchText, { color: themeColors.textSecondary }]}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: themeColors.primary, fontWeight: '700' }}>
                  {isLogin ? "Sign up" : "Login"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* --- CONFIRMATION MODALS --- */}
      <ConfirmationModal
        visible={showConfirmLogin}
        title="Login to your account?"
        message="Are you sure you want to continue logging in?"
        confirmText="Login"
        iconName="log-in"
        onCancel={() => setShowConfirmLogin(false)}
        onConfirm={executeLogin}
      />

      <ConfirmationModal
        visible={showConfirmSignUp}
        title="Create account?"
        message="Continue registration?"
        confirmText="Sign Up"
        iconName="person-add"
        onCancel={() => setShowConfirmSignUp(false)}
        onConfirm={executeSignUp}
      />

      {/* --- SUCCESS MODALS --- */}
      <SuccessModal
        visible={showSuccessLogin}
        title="Logged In Successfully"
        message="Welcome back."
        onConfirm={() => {
          setShowSuccessLogin(false);
          // Redirect to dashboard is automatically managed by AuthContext on user change,
          // but we route here to be sure.
          router.replace('/(tabs)/dashboard');
        }}
      />

      <SuccessModal
        visible={showSuccessSignUp}
        title="Account Created!"
        message="Your account has been created successfully."
        confirmText="Continue"
        onConfirm={() => {
          setShowSuccessSignUp(false);
          setIsLogin(true); // switch to login screen
        }}
      />

      {/* --- ERROR MODAL --- */}
      <ErrorModal
        visible={showErrorModal}
        title="Something went wrong"
        message={errorMessage}
        onConfirm={() => setShowErrorModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logoIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    ...Fonts.h1,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Fonts.h2,
    marginTop: 10,
    fontWeight: '700',
  },
  tagline: {
    ...Fonts.body,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  checklistCard: {
    borderRadius: Radius.input,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  checklistTitle: {
    ...Fonts.caption,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ruleText: {
    ...Fonts.caption,
    marginLeft: 8,
    fontWeight: '500',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    ...Fonts.body,
    fontWeight: '600',
  },
  mainButton: {
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    ...Fonts.body,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    width: '100%',
    marginBottom: 20,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleText: {
    ...Fonts.button,
    fontWeight: '600',
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  switchText: {
    ...Fonts.body,
  },
});