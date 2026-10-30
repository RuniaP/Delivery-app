import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatOpeningHours } from '../lib/format';

const TILE_SIZE = 140;

export default function StoreTile({ store, onPress }) {
  const hours = formatOpeningHours(store.open_time, store.close_time);

  return (
    <TouchableOpacity style={styles.tile} onPress={onPress}>
      {store.logo_url ? (
        <Image source={{ uri: store.logo_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="storefront-outline" size={36} color="#d32f2f" />
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>{store.name}</Text>
      {hours ? <Text style={styles.meta}>{hours}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { width: TILE_SIZE, marginRight: 12 },
  image: { width: TILE_SIZE, height: TILE_SIZE, borderRadius: 12 },
  placeholder: { backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#111', marginTop: 8 },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
});
