require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabaseAdmin = require('./lib/supabaseAdmin');

// Cách dùng: đặt ảnh vào backend/images/<thư mục bên dưới>/, tên file = tên trong
// database (đúng cả dấu), rồi chạy: node upload_images.js
//
//   images/stores/logo/Cửa hàng Quận 1.jpg    -> stores.logo_url
//   images/stores/cover/Cửa hàng Quận 1.jpg   -> stores.cover_image_url
//   images/products/Iced Americano.jpg        -> products.image_url
//
// Thêm loại ảnh mới (vd icon danh mục) chỉ cần thêm 1 dòng vào TARGETS.
const BUCKET = 'store-images';
const IMAGES_DIR = path.join(__dirname, 'images');
const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

const TARGETS = [
  { folder: 'stores/logo', table: 'stores', column: 'logo_url' },
  { folder: 'stores/cover', table: 'stores', column: 'cover_image_url' },
  { folder: 'products', table: 'products', column: 'image_url' },
];

async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) return;

  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (error) throw error;
  console.log(`Đã tạo bucket "${BUCKET}" (public)`);
}

async function processTarget({ folder, table, column }) {
  const dir = path.join(IMAGES_DIR, folder);
  if (!fs.existsSync(dir)) return 0;

  const { data: rows, error } = await supabaseAdmin.from(table).select('id, name');
  if (error) {
    console.error(`✗ Không đọc được bảng ${table}:`, error.message);
    return 0;
  }

  // Tên có thể trùng (vd cùng món ở 2 cửa hàng) nên mỗi tên ứng với danh sách id
  const idsByName = new Map();
  for (const row of rows) {
    const key = row.name.normalize('NFC');
    idsByName.set(key, [...(idsByName.get(key) ?? []), row.id]);
  }

  let done = 0;
  for (const file of fs.readdirSync(dir)) {
    const ext = path.extname(file);
    const contentType = CONTENT_TYPES[ext.toLowerCase()];
    if (!contentType) continue;

    const name = path.basename(file, ext).normalize('NFC');
    const ids = idsByName.get(name);
    if (!ids) {
      console.warn(`? ${folder}/${file}: không có "${name}" trong bảng ${table}`);
      continue;
    }

    const body = fs.readFileSync(path.join(dir, file));
    for (const id of ids) {
      // Tên file trên Storage dùng id (không dấu, không khoảng trắng) vì Storage
      // không nhận ký tự tiếng Việt trong đường dẫn.
      const storagePath = `${folder}/${id}${ext.toLowerCase()}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath, body, { contentType, upsert: true });
      if (uploadError) {
        console.error(`✗ Tải lên ${folder}/${file}:`, uploadError.message);
        continue;
      }

      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
      // ?v=... để app không dùng ảnh cũ trong cache khi bạn thay ảnh khác
      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({ [column]: `${data.publicUrl}?v=${Date.now()}` })
        .eq('id', id);
      if (updateError) {
        console.error(`✗ Cập nhật ${table}.${column}:`, updateError.message);
        continue;
      }

      console.log(`✓ ${table}.${column}: ${name}`);
      done += 1;
    }
  }
  return done;
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Chưa có thư mục ${IMAGES_DIR}. Tạo thư mục và đặt ảnh vào theo hướng dẫn ở đầu file.`);
    return;
  }

  await ensureBucket();

  let total = 0;
  for (const target of TARGETS) {
    total += await processTarget(target);
  }
  console.log(`\nHoàn tất: ${total} ảnh đã tải lên và gán vào database.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
