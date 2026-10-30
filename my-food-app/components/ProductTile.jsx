import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../lib/format';

const TILE_SIZE = 140;

export default function ProductTile({ product, onPress }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress}>
      <View>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="fast-food-outline" size={36} color="#d32f2f" />
          </View>
        )}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{formatPrice(product.base_price)}</Text>
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
      {product.store?.name ? (
        <Text style={styles.meta} numberOfLines={1}>{product.store.name}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { width: TILE_SIZE, marginRight: 12 },
  image: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 12 },
  placeholder: { backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },
  priceBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  priceText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700', color: '#111', marginTop: 8 },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
});
