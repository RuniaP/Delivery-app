import { createSlice } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';

const PRODUCT_TILE_COLUMNS = 'id, name, image_url, base_price, store:stores(id, name)';
const SINGLE_MENU_TAG = 'menu 1 người';
const SECTION_LIMIT = 10;

// Dữ liệu Trang chủ được lưu bền trên máy: mở app là có sẵn nội dung của lần trước,
// trong lúc fetchHome tải bản mới.
const homeSlice = createSlice({
  name: 'home',
  initialState: {
    categories: [],
    newStores: [],
    popularProducts: [],
    singleMenu: [],
    status: 'idle',
  },
  reducers: {
    homeLoading(state) {
      state.status = 'loading';
    },
    homeLoaded(state, action) {
      Object.assign(state, action.payload, { status: 'idle' });
    },
    homeFailed(state) {
      state.status = 'idle';
    },
  },
});

const { homeLoading, homeLoaded, homeFailed } = homeSlice.actions;
export default homeSlice.reducer;

export const fetchHome = () => async (dispatch) => {
  dispatch(homeLoading());
  try {
    const results = await Promise.all([
      supabase.from('categories').select('id, name, icon_key').order('sort_order'),
      supabase
        .from('stores')
        .select('id, name, logo_url, open_time, close_time')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(SECTION_LIMIT),
      // Chưa có dữ liệu bán hàng thật nên "nổi bật" tạm xếp theo số lượt đánh giá
      supabase
        .from('products')
        .select(PRODUCT_TILE_COLUMNS)
        .order('rating_count', { ascending: false })
        .order('rating_avg', { ascending: false })
        .limit(SECTION_LIMIT),
      supabase
        .from('products')
        .select(PRODUCT_TILE_COLUMNS)
        .contains('tags', [SINGLE_MENU_TAG])
        .limit(SECTION_LIMIT),
    ]);

    const failed = results.find((result) => result.error);
    if (failed) throw failed.error;

    const [categories, newStores, popularProducts, singleMenu] = results.map((result) => result.data);
    dispatch(homeLoaded({ categories, newStores, popularProducts, singleMenu }));
  } catch (error) {
    console.warn('Không tải được Trang chủ:', error.message);
    dispatch(homeFailed());
  }
};
