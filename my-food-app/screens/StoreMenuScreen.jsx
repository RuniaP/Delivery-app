import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { formatPrice, formatRating, formatOpeningHours } from '../lib/format';
import SectionHeader from '../components/SectionHeader';

const STORE_COLUMNS =
  'id, name, address, cover_image_url, rating_avg, rating_count, open_time, close_time';
const PRODUCT_COLUMNS =
  'id, name, description, image_url, base_price, rating_avg, rating_count, section:menu_sections(name, sort_order)';

function ProductRow({ product, onPress }) {
  return (
    <TouchableOpacity style={styles.productRow} onPress={onPress}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
        {product.description ? (
          <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
        ) : null}
        <Text style={styles.productRating}>{formatRating(product.rating_avg, product.rating_count)}</Text>
        <Text style={styles.productPrice}>{formatPrice(product.base_price)}</Text>
      </View>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="fast-food-outline" size={30} color="#d32f2f" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function StoreMenuScreen({ route, navigation }) {
  const { storeId } = route.params;
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [storeRes, productsRes] = await Promise.all([
        supabase.from('stores').select(STORE_COLUMNS).eq('id', storeId).single(),
        supabase.from('products').select(PRODUCT_COLUMNS).eq('store_id', storeId).eq('is_available', true).order('name'),
      ]);
      setStore(storeRes.data);
      setProducts(productsRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [storeId]);

  // Gom món theo danh mục, sắp theo sort_order của danh mục
  const sections = useMemo(() => {
    const groups = new Map();
    products.forEach((product) => {
      const title = product.section?.name ?? 'Khác';
      if (!groups.has(title)) {
        groups.set(title, { title, order: product.section?.sort_order ?? 999, data: [] });
      }
      groups.get(title).data.push(product);
    });
    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }, [products]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  const openingHours = formatOpeningHours(store?.open_time, store?.close_time);

  const storeHeader = store ? (
    <View style={styles.storeHeader}>
      {store.cover_image_url ? (
        <Image source={{ uri: store.cover_image_url }} style={styles.cover} />
      ) : null}
      <Text style={styles.storeName}>{store.name}</Text>
      <Text style={styles.storeMeta}>{formatRating(store.rating_avg, store.rating_count)}</Text>
      <Text style={styles.storeMeta}>{store.address}</Text>
      {openingHours ? <Text style={styles.storeMeta}>Giờ mở cửa: {openingHours}</Text> : null}
    </View>
  ) : null;

  return (
    <SectionList
      style={styles.list}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProductRow
          product={item}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        />
      )}
      renderSectionHeader={({ section }) => (
        <SectionHeader title={section.title} count={section.data.length} />
      )}
      ListHeaderComponent={storeHeader}
      ListEmptyComponent={<Text style={styles.emptyText}>Cửa hàng chưa có món nào</Text>}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#fff' },
  listContent: { paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  storeHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cover: { width: '100%', height: 140, borderRadius: 12, marginBottom: 12 },
  storeName: { fontSize: 20, fontWeight: '700', color: '#111' },
  storeMeta: { fontSize: 13, color: '#888', marginTop: 4 },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: '600', color: '#222' },
  productDescription: { fontSize: 13, color: '#888', marginTop: 3 },
  productRating: { fontSize: 12, color: '#888', marginTop: 4 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#d32f2f', marginTop: 4 },
  productImage: { width: 84, height: 84, borderRadius: 12 },
  productImagePlaceholder: { backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },

  emptyText: { textAlign: 'center', color: '#888', marginTop: 40 },
});
