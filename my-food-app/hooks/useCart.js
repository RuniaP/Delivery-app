import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, changeCartQuantity, removeCartItem, clearCart } from '../store/cartSlice';

// Giao diện giống CartContext trước đây nên các màn hình không phải đổi cách dùng.
// dispatch(thunk) trả về Promise của thunk, nên addItem/changeQuantity... vẫn `await` được.
export function useCart() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const status = useSelector((state) => state.cart.status);

  return useMemo(
    () => ({
      items,
      loading: status === 'loading',
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      // Giỏ chỉ chứa món của 1 cửa hàng (đơn hàng chỉ có 1 store_id)
      storeId: items[0]?.product.store_id ?? null,
      addItem: (payload) => dispatch(addToCart(payload)),
      changeQuantity: (itemId, quantity) => dispatch(changeCartQuantity(itemId, quantity)),
      removeItem: (itemId) => dispatch(removeCartItem(itemId)),
      clearCart: () => dispatch(clearCart()),
    }),
    [dispatch, items, status]
  );
}
