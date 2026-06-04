import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { DEV_MODE, mockUser } from '../config/dev';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<any>; 
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  clearResetting: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? (mockUser as any) : null);
  const [session, setSession] = useState<Session | null>(DEV_MODE ? null : null);
  const [isLoading, setIsLoading] = useState<boolean>(DEV_MODE ? false : true);
  const [isDarkMode, setIsDarkMode] = useState(false); // Added state
  const [isResetting, setIsResetting] = useState(false);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url) return;
      console.log('AuthContext: Received deep link:', url);

      // Parse the URL parameters (query or hash)
      let paramsString = '';
      const hashIndex = url.indexOf('#');
      const queryIndex = url.indexOf('?');
      if (hashIndex !== -1) {
        paramsString = url.substring(hashIndex + 1);
      } else if (queryIndex !== -1) {
        paramsString = url.substring(queryIndex + 1);
      }

      if (paramsString) {
        const searchParams = new URLSearchParams(paramsString);
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const errorDesc = searchParams.get('error_description');
        const type = searchParams.get('type');

        if (errorDesc) {
          console.log('AuthContext deep link error (suppressed LogBox):', errorDesc);
          return;
        }

        if (accessToken) {
          if (type === 'recovery') {
            console.log('AuthContext: Found access token with type recovery, setting isResetting=true...');
            setIsResetting(true);
          } else {
            console.log('AuthContext: Found access token, setting session...');
          }
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (error) throw error;
            console.log('AuthContext: Session set successfully. Routing to reset-password.');
            
            // Set user and session states immediately
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setIsLoading(false);
            
            // Navigate to reset-password
            router.replace('/reset-password');
          } catch (err) {
            console.log('AuthContext setSession error (suppressed LogBox):', err);
            setIsResetting(false);
          }
        }
      }
    };

    const checkInitialUrl = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          await handleDeepLink(url);
        }
      } catch (e) {
        console.error('Failed to get initial URL in AuthContext:', e);
      }
    };
    checkInitialUrl();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Load Dark Mode Preference
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark') setIsDarkMode(true);
    };
    loadTheme();

    if (DEV_MODE) {
      setUser(mockUser as any);
      setSession(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('Supabase init session error:', error);

        if (mounted) {
          setSession(data?.session ?? null);
          setUser(data?.session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('AuthContext onAuthStateChange event:', event);

      // When Supabase detects a PASSWORD_RECOVERY event, keep isResetting true
      // so the redirect logic sends the user to /reset-password, NOT dashboard
      if (event === 'PASSWORD_RECOVERY') {
        console.log('AuthContext: PASSWORD_RECOVERY event detected, setting isResetting=true');
        setIsResetting(true);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Theme Toggle Function
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    if (isLoading) return;

    const currentSegments = segments as string[];
    const isAuthScreen = currentSegments.includes('AuthScreen');
    const isForgotPasswordScreen = currentSegments.includes('ForgotPassScreen') || currentSegments.includes('forgot-password');
    const isResetPasswordScreen = currentSegments.includes('ResetPasswordScreen') || currentSegments.includes('reset-password');

    // If user is in recovery mode, force them to the reset-password screen
    if (isResetting && user) {
      if (!isResetPasswordScreen) {
        console.log('AuthContext: isResetting=true, forcing redirect to /reset-password');
        router.replace('/reset-password');
      }
      return; // Don't run any other redirect logic
    }

    if (!user && !isAuthScreen && !isForgotPasswordScreen && !isResetPasswordScreen) {
      router.replace('/AuthScreen');
    } 
    else if (user && isAuthScreen) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, segments, isResetting]); 

  const signUp = async (email: string, password: string) => {
    if (DEV_MODE) {
      setUser(mockUser as any);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: 'exp://192.168.1.4:8081/--/AuthScreen' },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Registration configuration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    if (DEV_MODE) {
      setUser(mockUser as any);
      setSession(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('Supabase refresh session error:', error);
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
    } catch (error) {
      console.error('Auth refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during secure session termination:', error);
    } finally {
      setUser(null);
      setSession(null);
      setIsResetting(false);
    }
  };

  const clearResetting = () => {
    console.log('AuthContext: clearResetting called, isResetting=false');
    setIsResetting(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signOut, refreshSession, isDarkMode, toggleTheme, clearResetting }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}