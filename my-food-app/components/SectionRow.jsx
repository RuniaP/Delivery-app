import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

// Một khối ở Trang chủ: tiêu đề + (tùy chọn) "Xem tất cả" + hàng cuộn ngang chứa children.
export default function SectionRow({ title, onSeeAll, children }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll ? (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 8, borderTopColor: '#f5f5f5', paddingVertical: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  seeAll: { fontSize: 13, color: '#999' },
  content: { paddingHorizontal: 16 },
});
