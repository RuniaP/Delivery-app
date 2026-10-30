import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRating } from '../lib/format';

export default function StoreCard({ store, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {store.logo_url ? (
        <Image source={{ uri: store.logo_url }} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder]}>
          <Ionicons name="storefront-outline" size={28} color="#d32f2f" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{store.name}</Text>
        <Text style={styles.meta}>{formatRating(store.rating_avg, store.rating_count)}</Text>
        <Text style={styles.meta} numberOfLines={1}>{store.address}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  logo: { width: 72, height: 72, borderRadius: 12, marginRight: 14 },
  logoPlaceholder: { backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  meta: { fontSize: 13, color: '#888', marginTop: 3 },
});
