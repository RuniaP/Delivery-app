const express = require('express');
const cors = require('cors');
require('dotenv').config();
const supabaseAdmin = require('./lib/supabaseAdmin');

const app = express();
app.use(cors());
app.use(express.json());

// Kiểm tra server + kết nối database
app.get('/', async (req, res) => {
  const { error } = await supabaseAdmin.from('stores').select('id').limit(1);
  res.json({
    server: 'ok',
    database: error ? 'error' : 'connected',
    error: error?.message,
  });
});

// Danh sách sản phẩm (public, dùng chung với client, nhưng qua backend để
// kiểm soát/log nếu cần sau này)
app.get('/api/products', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_available', true);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Cập nhật trạng thái đơn hàng - việc mà staff/admin làm, dùng service role
// để chắc chắn thao tác thành công bất kể RLS
app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Xác nhận thanh toán thủ công (nhân viên bấm sau khi kiểm tra đã nhận tiền)
app.patch('/api/orders/:id/payment', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ payment_status: 'paid' })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend đang chạy tại http://localhost:${PORT}`);
});
