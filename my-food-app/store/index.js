import { configureStore } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cartReducer from './cartSlice';
import homeReducer from './homeSlice';

// Mỗi slice lưu bền riêng. blacklist: 'status' là trạng thái tạm (đang tải...),
// không lưu để khỏi bị kẹt "đang tải" khi mở lại app.
const persistSlice = (key, reducer) =>
  persistReducer({ key, storage: AsyncStorage, blacklist: ['status'] }, reducer);

export const store = configureStore({
  reducer: {
    cart: persistSlice('cart', cartReducer),
    home: persistSlice('home', homeReducer),
  },
  // getDefaultMiddleware đã gồm redux-thunk, nên viết thunk được ngay.
  // Các action của redux-persist chứa hàm nên phải bỏ qua kiểm tra serializable.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
