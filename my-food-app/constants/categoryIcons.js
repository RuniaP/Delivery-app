// Khóa trong cột categories.icon_key -> ảnh PNG đóng gói sẵn trong app.
// Thêm danh mục mới có icon: bỏ file vào assets/FoodCategory, thêm 1 dòng ở đây,
// rồi đặt icon_key tương ứng cho danh mục trong database.
// Metro cần đường dẫn viết cố định trong require nên không ghép chuỗi được.
export const CATEGORY_ICONS = {
  VietFood: require('../assets/FoodCategory/VietFood.png'),
  ChineseFood: require('../assets/FoodCategory/ChineseFood.png'),
  JapanFood: require('../assets/FoodCategory/JapanFood.png'),
  ThaiFood: require('../assets/FoodCategory/ThaiFood.png'),
  EuropeFood: require('../assets/FoodCategory/EuropeFood.png'),
  'BBQ&Chicken': require('../assets/FoodCategory/BBQ&Chicken.png'),
  SnackJunkFood: require('../assets/FoodCategory/SnackJunkFood.png'),
  'Coffee&Cake': require('../assets/FoodCategory/Coffee&Cake.png'),
};

// Ô "Tất cả" ở đầu lưới danh mục (không nằm trong database)
export const ALL_CATEGORY_ICON = require('../assets/FoodCategory/EmpyPlate.png');
