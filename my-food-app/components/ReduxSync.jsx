import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../contexts/AuthContext';
import { loadCart, cartReset } from '../store/cartSlice';
import { fetchHome } from '../store/homeSlice';

// Không hiển thị gì, chỉ nối Redux với trạng thái đăng nhập:
// đăng nhập/mở lại app -> tải giỏ hàng và dữ liệu Trang chủ,
// đăng xuất -> xóa giỏ hàng đang lưu trên máy (tránh người sau thấy giỏ của người trước).
export default function ReduxSync() {
  const { session } = useAuth();
  const dispatch = useDispatch();
  const userId = session?.user.id;

  useEffect(() => {
    if (userId) {
      dispatch(loadCart());
      dispatch(fetchHome());
    } else {
      dispatch(cartReset());
    }
  }, [userId, dispatch]);

  return null;
}
