import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManageMenuScreen from '../screens/ManageMenuScreen';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';

const Tab = createBottomTabNavigator();

// Thêm/bớt tab chỉ cần sửa các mảng này. Khi làm xong màn hình thật,
// thay PlaceholderScreen bằng component tương ứng.
const CUSTOMER_TABS = [
  { name: 'Home', label: 'Trang chủ', icon: 'home', component: HomeScreen },
  { name: 'Cart', label: 'Giỏ hàng', icon: 'cart', component: CartScreen },
  { name: 'Orders', label: 'Đơn hàng', icon: 'receipt', component: PlaceholderScreen },
  { name: 'Profile', label: 'Tôi', icon: 'person', component: ProfileScreen },
];

const STAFF_TABS = [
  { name: 'ManageMenu', label: 'Quản lý món', icon: 'restaurant', component: ManageMenuScreen },
  { name: 'Profile', label: 'Tôi', icon: 'person', component: ProfileScreen },
];

export default function MainTabs() {
  const { profile } = useAuth();
  const { count } = useCart();
  // Admin tạm dùng giao diện khách hàng cho tới khi làm màn hình riêng
  const tabs = profile?.role === 'staff' ? STAFF_TABS : CUSTOMER_TABS;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'shift', // màn hình trượt nhẹ trái/phải khi đổi tab
        tabBarBadgeStyle: { backgroundColor: '#d32f2f' },
        tabBarActiveTintColor: '#d32f2f',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {tabs.map(({ name, label, icon, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          initialParams={{ title: label }}
          options={{
            tabBarLabel: label,
            tabBarBadge: name === 'Cart' && count > 0 ? count : undefined,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? icon : `${icon}-outline`} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
