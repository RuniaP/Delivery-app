import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET = 'store-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_BYTES = 1024;
const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// Chọn ảnh từ thư viện và giữ nguyên file gốc (không cắt, không nén lại) để bộ xử lý
// ảnh của picker không làm hỏng ảnh WebP. Ảnh vẫn hiển thị dạng vuông nhờ resizeMode "cover".
// Trả về ảnh đã chọn, hoặc null nếu người dùng hủy.
export async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    base64: true, // lấy dữ liệu ảnh ngay trong kết quả, không cần đọc lại file
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
    throw new Error('Ảnh lớn hơn 5MB. Hãy chọn ảnh nhỏ hơn (nên dùng ảnh WebP khoảng 200KB).');
  }
  return asset;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

// Đảm bảo file trên Storage không rỗng/hỏng trước khi gán vào món,
// thay vì lưu im lặng một ảnh trắng.
async function assertUploaded(publicUrl) {
  const response = await fetch(publicUrl, { method: 'HEAD' });
  const size = response.headers.get('content-length');
  if (!response.ok || (size !== null && Number(size) < MIN_IMAGE_BYTES)) {
    throw new Error('Ảnh tải lên bị lỗi, vui lòng chọn lại ảnh và thử lại.');
  }
}

// Upload vào products/<store_id>/<thời gian>.<đuôi> (đúng thư mục mà policy cho phép
// nhân viên ghi) và trả về link công khai của ảnh.
export async function uploadProductImage(asset, storeId) {
  const uriExtension = asset.uri.split('.').pop().toLowerCase();
  const mimeType = asset.mimeType ?? MIME_BY_EXTENSION[uriExtension] ?? 'image/jpeg';
  const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
  const path = `products/${storeId}/${Date.now()}.${extension}`;

  if (!asset.base64) throw new Error('Không đọc được dữ liệu ảnh, vui lòng chọn lại ảnh.');

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(asset.base64), { contentType: mimeType });
  if (error) throw error;

  const { publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path).data;
  await assertUploaded(publicUrl);
  return publicUrl;
}
