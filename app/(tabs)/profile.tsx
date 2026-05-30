import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase'; 
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/'); 
        return;
      }

      // Fetch from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle(); 

      if (error) throw error;

      // DYNAMIC FALLBACK: 
      // Kung walang record sa DB, kunin ang pangalan bago ang @ sa email
      const displayName = data?.full_name || (user.email ? user.email.split('@')[0] : 'User');
      const displayEmail = data?.email || user.email;

      setProfile({ 
        full_name: displayName, 
        email: displayEmail 
      });
      
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Hindi makuha ang profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.replace('/');
    } else {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Profile</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <Text style={styles.value}>{profile?.full_name}</Text>
        
        <Text style={styles.label}>Email Address</Text>
        <Text style={styles.value}>{profile?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f4f4' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  label: { fontSize: 12, color: '#888', marginBottom: 5, textTransform: 'uppercase' },
  value: { fontSize: 18, color: '#333', marginBottom: 15, fontWeight: '500' },
  logoutButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});