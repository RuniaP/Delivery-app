import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AccountInfoScreen({ navigation }) {
  const { session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
      }
      setLoading(false);
    };
    loadProfile();
  }, [session.user.id]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Họ và tên không được để trống.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', session.user.id);
    setSaving(false);

    if (error) {
      Alert.alert('Lưu thất bại', error.message);
      return;
    }
    Alert.alert('Thành công', 'Đã cập nhật thông tin tài khoản.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.fieldLabel}>Email</Text>
      <Text style={styles.readOnlyValue}>{session.user.email}</Text>

      <Text style={styles.fieldLabel}>Họ và tên</Text>
      <TextInput style={styles.underlineInput} value={fullName} onChangeText={setFullName} />

      <Text style={styles.fieldLabel}>Số điện thoại</Text>
      <TextInput
        style={styles.underlineInput}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fieldLabel: { fontSize: 14, color: '#888', marginTop: 20 },
  readOnlyValue: {
    fontSize: 16,
    color: '#555',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
