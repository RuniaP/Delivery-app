// 58000 -> "58.000đ" (tự chèn dấu chấm, không phụ thuộc Intl của Hermes)
export const formatPrice = (amount) =>
  `${Math.round(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}đ`;

// (4.8, 126) -> "★ 4.8 (126)"
export const formatRating = (average, count) =>
  count > 0 ? `★ ${Number(average).toFixed(1)} (${count})` : 'Chưa có đánh giá';

// ('07:00:00', '22:00:00') -> "07:00 - 22:00"; thiếu giờ thì trả về null
export const formatOpeningHours = (open, close) =>
  open && close ? `${open.slice(0, 5)} - ${close.slice(0, 5)}` : null;
