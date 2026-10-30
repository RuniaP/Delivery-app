const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// service_role key bỏ qua RLS - chỉ dùng ở backend, KHÔNG đưa vào app mobile
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabaseAdmin;
