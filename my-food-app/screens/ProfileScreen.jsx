import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Mỗi phần tử là 1 nhóm (ngăn cách nhau bằng đường kẻ).
// Mục có `route` sẽ điều hướng sang màn hình đó, mục còn lại hiện "Sắp ra mắt".
const MENU_GROUPS = [
  [
    { icon: 'person-circle-outline', label: 'Thông tin tài khoản', route: 'AccountInfo' },
    { icon: 'megaphone-outline', label: 'Thông báo app' },
    { icon: 'gift-outline', label: 'Ưu đãi' },
  ],
  [
    { icon: 'location-outline', label: 'Địa chỉ của tôi' },
    { icon: 'card-outline', label: 'Thông tin thanh toán' },
    { icon: 'documents-outline', label: 'Chi tiết đơn hàng' },
    { icon: 'heart-outline', label: 'Menu và cửa hàng yêu thích' },
    { icon: 'time-outline', label: 'Menu đã xem gần đây' },
  ],
  [
    { icon: 'mail-outline', label: 'CSKH' },
    { icon: 'reader-outline', label: 'Quy chế hoạt động' },
  ],
  [{ icon: 'storefront-outline', label: 'Đăng ký cửa hàng' }],
];

export default function ProfileScreen({ navigation }) {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);

  // Tải lại mỗi lần tab được focus, để thấy ngay thay đổi sau khi sửa thông tin tài khoản
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const userId = session.user.id;
        const [profileRes, reviewRes] = await Promise.all([
          supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single(),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        ]);
        if (profileRes.data) setProfile(profileRes.data);
        setReviewCount(reviewRes.count ?? 0);
      };
      load();
    }, [session.user.id])
  );

  const displayName = profile?.full_name || session.user.email;

  // Điểm và Voucher chưa có bảng trong database nên tạm để 0
  const stats = [
    { label: 'Điểm', value: 0 },
    { label: 'Voucher/Coupon', value: 0 },
    { label: 'Review', value: reviewCount },
  ];

  const showComingSoon = (label) =>
    Alert.alert('Sắp ra mắt', `Chức năng "${label}" sẽ được thêm sau.`);

  const handleItemPress = (item) =>
    item.route ? navigation.navigate(item.route) : showComingSoon(item.label);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => showComingSoon('Cài đặt')}>
            <Ionicons name="settings-outline" size={26} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showComingSoon('Thông báo')}>
            <Ionicons name="notifications-outline" size={26} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.email} numberOfLines={1}>{session.user.email}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={[styles.statItem, index > 0 && styles.statDivider]}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {MENU_GROUPS.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.group}>
            {group.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleItemPress(item)}
              >
                <Ionicons name={item.icon} size={26} color="#555" style={styles.menuIcon} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={styles.group}>
          <TouchableOpacity style={styles.menuItem} onPress={signOut}>
            <Ionicons name="log-out-outline" size={26} color="#d32f2f" style={styles.menuIcon} />
            <Text style={[styles.menuLabel, styles.logoutLabel]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fde8e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#d32f2f' },
  headerText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#111' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: '#eee' },
  statLabel: { fontSize: 14, color: '#888' },
  statValue: { fontSize: 20, fontWeight: '600', color: '#111', marginTop: 4 },

  group: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  menuIcon: { marginRight: 16 },
  menuLabel: { fontSize: 16, fontWeight: '500', color: '#111' },
  logoutLabel: { color: '#d32f2f' },
});
