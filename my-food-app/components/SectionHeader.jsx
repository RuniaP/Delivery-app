import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Tiêu đề một mục trong menu. children (nếu có) hiện ở bên phải, vd nút đổi thứ tự.
export default function SectionHeader({ title, count, children }) {
  return (
    <View style={styles.container}>
      <View style={styles.titleBox}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.count}>{count} món</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  titleBox: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  count: { fontSize: 12, color: '#888', marginTop: 2 },
});
