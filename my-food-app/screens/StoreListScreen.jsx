import React, { useEffect, useState } from 'react';
import { Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import StoreCard from '../components/StoreCard';

const STORE_COLUMNS = 'id, name, address, logo_url, rating_avg, rating_count';

// params: { title, categoryId?, sort? }
//   categoryId: chỉ lấy cửa hàng có ít nhất 1 món thuộc danh mục đó
//   sort: 'newest' (mới nhất) hoặc mặc định theo điểm sao
export default function StoreListScreen({ route, navigation }) {
  const { categoryId = null, sort = 'rating' } = route.params;
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      let query = supabase
        .from('stores')
        .select(categoryId ? `${STORE_COLUMNS}, products!inner(category_id)` : STORE_COLUMNS)
        .eq('is_active', true);
      if (categoryId) query = query.eq('products.category_id', categoryId);

      query =
        sort === 'newest'
          ? query.order('created_at', { ascending: false })
          : query.order('rating_avg', { ascending: false });

      const { data } = await query;
      if (active) {
        setStores(data ?? []);
        setLoading(false);
      }
    };
    load();

    return () => {
      active = false;
    };
  }, [categoryId, sort]);

  if (loading) return <ActivityIndicator style={styles.loading} color="#d32f2f" />;

  return (
    <FlatList
      style={styles.list}
      data={stores}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StoreCard
          store={item}
          onPress={() => navigation.navigate('StoreMenu', { storeId: item.id, storeName: item.name })}
        />
      )}
      ListEmptyComponent={<Text style={styles.empty}>Chưa có cửa hàng nào</Text>}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#fff' },
  content: { paddingVertical: 8 },
  loading: { flex: 1, backgroundColor: '#fff' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
