import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { DEV_MODE, mockUser } from '../config/dev';
import { useRouter, useSegments } from 'expo-router';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<any>; 
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // TEMP DEV MODE - AUTH DISABLED
  const [user, setUser] = useState<User | null>(DEV_MODE ? (mockUser as any) : null);
  const [session, setSession] = useState<Session | null>(DEV_MODE ? null : null);
  const [isLoading, setIsLoading] = useState<boolean>(DEV_MODE ? false : true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
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
        if (error) {
          console.error('Supabase init session error:', error);
        }

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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // 🔒 ROUTE GUARD NAVIGATION LIFECYCLE
  // ==========================================
  useEffect(() => {
    if (isLoading) return;

    const currentSegments = segments as string[];
    const nasaAuthScreen = currentSegments.includes('AuthScreen');
    
    // 🛠️ FIX: Added passthrough identifier to prevent the routing loop from ejecting recovery link traffic
    const nasaResetScreen = currentSegments.includes('ResetPasswordScreen');

    if (!user && !nasaAuthScreen && !nasaResetScreen) {
      router.replace('/AuthScreen');
    } 
    else if (user && nasaAuthScreen) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading, segments]); 

  // ==========================================
  // 🚀 CORE AUTH FUNCTIONS
  // ==========================================
  
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
        options: {
          emailRedirectTo: 'exp://192.168.1.4:8081/--/AuthScreen',
        },
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
      if (error) {
        console.error('Supabase refresh session error:', error);
      }
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
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signOut, refreshSession }}>
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