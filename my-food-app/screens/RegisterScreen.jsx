import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const goToStep2 = () => {
    if (!phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại.');
      return;
    }
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const goToStep1 = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRegister = async () => {
    if (!agreeTerms) {
      setTermsError(true);
      return;
    }
    if (!email || !fullName || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Vui lòng nhập lại mật khẩu xác nhận.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password, fullName, phone);
    setLoading(false);

    if (error) {
      Alert.alert('Đăng ký thất bại', error.message);
      return;
    }

    // Nếu đã tắt "Confirm email", signUp tự tạo session -> App.js tự chuyển
    // sang màn User, không cần navigate thủ công.
    if (data?.session) return;

    Alert.alert('Thành công', 'Tài khoản đã được tạo. Vui lòng đăng nhập.');
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.viewport}>
        <Animated.View style={[styles.pagesRow, { transform: [{ translateX: slideAnim }] }]}>
          {/* ---- BƯỚC 1: Số điện thoại ---- */}
          <View style={styles.page}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Đăng ký bằng số điện thoại</Text>

            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+84</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Số điện thoại của bạn"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={goToStep2}>
              <Text style={styles.buttonText}>Tiếp tục</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('Sắp ra mắt', 'Đăng nhập Facebook sẽ được thêm sau.')}
            >
              <Image source={require('../assets/Facebook.png')} style={styles.facebookIcon} />
              <Text style={styles.socialButtonText}>Tiếp tục với Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('Sắp ra mắt', 'Đăng nhập Google sẽ được thêm sau.')}
            >
              <Image source={require('../assets/Google.png')} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Tiếp tục với Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
            </TouchableOpacity>
          </View>

          {/* ---- BƯỚC 2: Thông tin đăng ký ---- */}
          <View style={styles.page}>
            <ScrollView contentContainerStyle={styles.step2Scroll} keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={goToStep1} style={styles.backButton}>
                <Text style={styles.backButtonText}>{'←'}</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Đăng ký thành viên</Text>

              <Text style={styles.fieldLabel}>Email (ID)</Text>
              <TextInput
                style={styles.underlineInput}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.fieldLabel}>Tên</Text>
              <TextInput style={styles.underlineInput} value={fullName} onChangeText={setFullName} />

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

              <Text style={styles.fieldLabel}>Xác nhận mật khẩu</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.underlineInputFlex}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setAgreeTerms(!agreeTerms);
                  setTermsError(false);
                }}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Đồng ý điều khoản sử dụng dịch vụ</Text>
              </TouchableOpacity>

              {termsError && (
                <Text style={styles.errorText}>Vui lòng đồng ý điều khoản sử dụng dịch vụ</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, !agreeTerms && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Đang tạo...' : 'Đăng ký'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  viewport: { flex: 1, width, overflow: 'hidden', backgroundColor: '#fff' },
  pagesRow: { flexDirection: 'row', width: width * 2, flex: 1 },
  page: { width, flex: 1, padding: 24, backgroundColor: '#fff' },

  title: { fontSize: 26, fontWeight: '700', marginTop: 40, marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#777', marginBottom: 32 },

  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
  },
  countryCode: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  countryCodeText: { fontSize: 16, fontWeight: '600' },
  phoneInput: { flex: 1, padding: 14, fontSize: 16 },

  button: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { marginHorizontal: 12, color: '#999' },

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
  link: { color: '#d32f2f', textAlign: 'center', marginTop: 20 },

  step2Scroll: { paddingBottom: 24 },
  backButton: { marginTop: 8, marginBottom: 8 },
  backButtonText: { fontSize: 24 },
  fieldLabel: { fontSize: 14, color: '#333', marginTop: 20 },
  underlineInput: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 8, fontSize: 16 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  underlineInputFlex: { flex: 1, paddingVertical: 8, fontSize: 16 },
  eyeIcon: { fontSize: 18, paddingHorizontal: 8 },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 14, color: '#333' },
  errorText: { color: '#d32f2f', fontSize: 13, marginTop: 8 },

  submitButton: { backgroundColor: '#d32f2f', padding: 16, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#bbb' },
});
