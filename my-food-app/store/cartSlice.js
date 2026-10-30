import { createSlice } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';

const CART_ITEM_COLUMNS = `
  id, quantity,
  product:products(id, name, image_url, base_price, store_id),
  cart_item_options(option:options(id, name, extra_price))
`;

// Giá 1 phần = giá món + tổng giá các tùy chọn đã chọn (tính theo giá hiện tại)
const normalizeItem = (row) => {
  const options = row.cart_item_options.map((entry) => entry.option);
  const optionsPrice = options.reduce((sum, option) => sum + Number(option.extra_price), 0);
  return {
    id: row.id,
    quantity: row.quantity,
    product: row.product,
    options,
    unitPrice: Number(row.product.base_price) + optionsPrice,
  };
};

// Cùng món + cùng bộ tùy chọn thì gộp vào một dòng, chỉ tăng số lượng
const optionSignature = (optionIds) => [...optionIds].sort().join(',');

const getUserId = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

// ---------------------------------------------------------------
// Slice: state + reducer (chỉ thay đổi state, không gọi mạng)
// userId ghi lại giỏ này của ai, để không hiện nhầm giỏ của người khác trên cùng máy.
// status là trạng thái tạm nên không được lưu bền (xem store/index.js).
// ---------------------------------------------------------------
const initialState = { userId: null, items: [], status: 'idle' };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    cartLoading(state) {
      state.status = 'loading';
    },
    cartLoaded(state, action) {
      state.userId = action.payload.userId;
      state.items = action.payload.items;
      state.status = 'idle';
    },
    cartFailed(state) {
      state.status = 'idle';
    },
    quantityChanged(state, action) {
      const item = state.items.find((entry) => entry.id === action.payload.itemId);
      if (item) item.quantity = action.payload.quantity;
    },
    itemRemoved(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    cartEmptied(state) {
      state.items = [];
    },
    cartReset() {
      return initialState;
    },
  },
});

const {
  cartLoading,
  cartLoaded,
  cartFailed,
  quantityChanged,
  itemRemoved,
  cartEmptied,
} = cartSlice.actions;

export const { cartReset } = cartSlice.actions;
export default cartSlice.reducer;

// ---------------------------------------------------------------
// Thunk: hàm trả về một hàm async nhận (dispatch, getState).
// Chạy bất đồng bộ (gọi Supabase) rồi dispatch các action ở trên để cập nhật state.
// ---------------------------------------------------------------
export const loadCart = () => async (dispatch, getState) => {
  const userId = await getUserId();
  if (!userId) {
    dispatch(cartReset());
    return;
  }

  // Giỏ đang lưu trên máy là của người khác thì bỏ đi
  const savedUserId = getState().cart.userId;
  if (savedUserId && savedUserId !== userId) dispatch(cartReset());

  dispatch(cartLoading());
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(CART_ITEM_COLUMNS)
      .eq('user_id', userId)
      .order('created_at');
    if (error) throw error;

    // Món đã bị ẩn/ngừng bán thì product = null, bỏ qua
    dispatch(cartLoaded({ userId, items: data.filter((row) => row.product).map(normalizeItem) }));
  } catch (error) {
    console.warn('Không tải được giỏ hàng:', error.message);
    dispatch(cartFailed());
  }
};

export const addToCart = ({ product, quantity, optionIds }) => async (dispatch, getState) => {
  try {
    const userId = await getUserId();
    const signature = optionSignature(optionIds);
    const existing = getState().cart.items.find(
      (item) =>
        item.product.id === product.id &&
        optionSignature(item.options.map((option) => option.id)) === signature
    );

    if (existing) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { data: row, error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: product.id, quantity })
        .select('id')
        .single();
      if (error) throw error;

      if (optionIds.length > 0) {
        const { error: optionError } = await supabase
          .from('cart_item_options')
          .insert(optionIds.map((optionId) => ({ cart_item_id: row.id, option_id: optionId })));
        if (optionError) throw optionError;
      }
    }

    await dispatch(loadCart());
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const removeCartItem = (itemId) => async (dispatch) => {
  const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
  if (!error) dispatch(itemRemoved(itemId));
  return { error };
};

// Số lượng về 0 thì xóa món khỏi giỏ
export const changeCartQuantity = (itemId, quantity) => async (dispatch) => {
  if (quantity <= 0) return dispatch(removeCartItem(itemId));

  const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
  if (!error) dispatch(quantityChanged({ itemId, quantity }));
  return { error };
};

export const clearCart = () => async (dispatch) => {
  const userId = await getUserId();
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
  if (!error) dispatch(cartEmptied());
  return { error };
};
