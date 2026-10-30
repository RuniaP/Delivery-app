import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Chỉ hiển thị và báo số lượng mới qua onChange. Nơi dùng tự quyết định giới hạn
// (trang món: tối thiểu 1; giỏ hàng: về 0 thì xóa món).
export default function QuantityStepper({ value, onChange }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => onChange(value - 1)} hitSlop={8}>
        <Ionicons name="remove" size={18} color="#d32f2f" />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity style={styles.button} onPress={() => onChange(value + 1)} hitSlop={8}>
        <Ionicons name="add" size={18} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d32f2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 34, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#111' },
});
