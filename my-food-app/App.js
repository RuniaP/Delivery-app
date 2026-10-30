import 'react-native-url-polyfill/auto';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { store, persistor } from './store';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ReduxSync from './components/ReduxSync';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AccountInfoScreen from './screens/AccountInfoScreen';
import StoreListScreen from './screens/StoreListScreen';
import StoreMenuScreen from './screens/StoreMenuScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ProductFormScreen from './screens/ProductFormScreen';
import MainTabs from './navigation/MainTabs';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) return null; // có thể thay bằng splash screen

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="StoreList"
            component={StoreListScreen}
            options={({ route }) => ({ headerShown: true, title: route.params.title })}
          />
          <Stack.Screen
            name="StoreMenu"
            component={StoreMenuScreen}
            options={({ route }) => ({ headerShown: true, title: route.params.storeName })}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ headerShown: true, title: 'Chi tiết món' }}
          />
          <Stack.Screen
            name="ProductForm"
            component={ProductFormScreen}
            options={({ route }) => ({
              headerShown: true,
              title: route.params?.productId ? 'Sửa món' : 'Thêm món',
            })}
          />
          <Stack.Screen
            name="AccountInfo"
            component={AccountInfoScreen}
            options={{ headerShown: true, title: 'Thông tin tài khoản' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    // GestureHandlerRootView bắt buộc để các cử chỉ (vuốt xóa món...) hoạt động
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        {/* Chờ Redux đọc xong dữ liệu đã lưu trên máy rồi mới hiện giao diện */}
        <PersistGate loading={null} persistor={persistor}>
          <AuthProvider>
            <ReduxSync />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
