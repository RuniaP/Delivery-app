import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = email.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!isValid) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert('Đăng nhập thất bại', error.message);
  };

  return (
    <View style={styles.container}>
      {navigation.canGoBack() && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'←'}</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.title}>Đăng nhập</Text>

      <TouchableOpacity
        style={styles.phoneButton}
        onPress={() => Alert.alert('Sắp ra mắt', 'Đăng nhập bằng SĐT sẽ được thêm sau.')}
      >
        <Text style={styles.phoneButtonText}>📞  Đăng nhập SĐT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => Alert.alert('Sắp ra mắt', 'Đăng nhập Facebook sẽ được thêm sau.')}
      >
        <Image source={require('../assets/Facebook.png')} style={styles.facebookIcon} />
        <Text style={styles.socialButtonText}>Đăng nhập bằng Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => Alert.alert('Sắp ra mắt', 'Đăng nhập Google sẽ được thêm sau.')}
      >
        <Image source={require('../assets/Google.png')} style={styles.socialIcon} />
        <Text style={styles.socialButtonText}>Đăng nhập bằng Google</Text>
      </TouchableOpacity>

      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <Text style={styles.fieldLabel}>Email</Text>
      <TextInput
        style={styles.underlineInput}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.fieldLabel}>Mật khẩu</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.underlineInputFlex}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
      </TouchableOpacity>

      <View style={styles.bottomLinksRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Đăng ký thành viên</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Alert.alert('Sắp ra mắt', 'Chức năng tìm mật khẩu sẽ được thêm sau.')}
        >
          <Text style={styles.link}>Tìm mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  backButton: { marginTop: 8, marginBottom: 8 },
  backButtonText: { fontSize: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 24 },

  phoneButton: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },

  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef3f3',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 12,
  },
  socialIcon: { width: 20, height: 20, marginRight: 10, resizeMode: 'contain' },
  facebookIcon: { width: 28, height: 28, marginRight: 10, resizeMode: 'contain' },
  socialButtonText: { fontSize: 15, fontWeight: '600', color: '#333' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 24 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ddd', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#999' },

  fieldLabel: { fontSize: 14, color: '#333', marginTop: 12 },
  underlineInput: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 8, fontSize: 16 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  underlineInputFlex: { flex: 1, paddingVertical: 8, fontSize: 16 },
  eyeIcon: { fontSize: 18, paddingHorizontal: 8 },

  submitButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: { backgroundColor: '#f2a3a3' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  bottomLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  link: { color: '#999', fontSize: 14 },
});
