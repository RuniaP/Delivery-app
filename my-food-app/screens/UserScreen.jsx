import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function UserScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, role, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (!error) setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, [session]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang cá nhân</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Họ và tên</Text>
        <Text style={styles.value}>{profile?.full_name || '—'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session.user.email}</Text>

        <Text style={styles.label}>Số điện thoại</Text>
        <Text style={styles.value}>{profile?.phone || 'Chưa cập nhật'}</Text>

        <Text style={styles.label}>Vai trò</Text>
        <Text style={styles.value}>{profile?.role || 'customer'}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, marginTop: 40 },
  infoBox: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  label: { fontSize: 13, color: '#888', marginTop: 12 },
  value: { fontSize: 16, fontWeight: '500', marginTop: 2 },
  button: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
