import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS, ALL_CATEGORY_ICON } from '../constants/categoryIcons';

const COLUMNS = 5; // đổi thành 4 nếu muốn ô to hơn
const ICON_SIZE = 56;

// categories: danh sách từ database. onSelect(category) với category = null là ô "Tất cả".
export default function CategoryGrid({ categories, onSelect }) {
  const tiles = [
    { id: 'all', name: 'Tất cả', icon: ALL_CATEGORY_ICON, category: null },
    ...categories.map((category) => ({
      id: category.id,
      name: category.name,
      icon: CATEGORY_ICONS[category.icon_key] ?? null,
      category,
    })),
  ];

  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <TouchableOpacity
          key={tile.id}
          style={styles.tile}
          onPress={() => onSelect(tile.category)}
        >
          {tile.icon ? (
            <Image source={tile.icon} style={styles.icon} />
          ) : (
            <View style={[styles.icon, styles.iconPlaceholder]}>
              <Ionicons name="restaurant-outline" size={26} color="#d32f2f" />
            </View>
          )}
          <Text style={styles.label} numberOfLines={2}>{tile.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingVertical: 12 },
  tile: { width: `${100 / COLUMNS}%`, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
  icon: { width: ICON_SIZE, height: ICON_SIZE, resizeMode: 'contain' },
  iconPlaceholder: { backgroundColor: '#fde8e8', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '500', color: '#222', textAlign: 'center', marginTop: 6, minHeight: 30 },
});
