import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
import { fetchHome } from '../store/homeSlice';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/format';
import { HOME_BANNERS } from '../constants/banners';
import BannerCarousel from '../components/BannerCarousel';
import CategoryGrid from '../components/CategoryGrid';
import SectionRow from '../components/SectionRow';
import StoreTile from '../components/StoreTile';
import ProductTile from '../components/ProductTile';

function HomeHeader({ cartCount, onRefresh, onPressAddress, onPressCart }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onRefresh} hitSlop={8}>
        <Ionicons name="refresh" size={24} color="#111" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.address} onPress={onPressAddress}>
        <Text style={styles.addressText} numberOfLines={1}>Chọn địa chỉ giao hàng</Text>
        <Ionicons name="chevron-down" size={18} color="#111" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onPressCart} hitSlop={8}>
        <Ionicons name="cart-outline" size={26} color="#111" />
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SearchResultRow({ result, onPress }) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress}>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{result.product_name}</Text>
        <Text style={styles.resultStore} numberOfLines={1}>{result.store_name}</Text>
        <Text style={styles.resultPrice}>{formatPrice(result.base_price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const home = useSelector((state) => state.home);
  const { count } = useCart();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isSearching = keyword.trim().length > 0;
  const refreshHome = () => dispatch(fetchHome());

  // Tìm kiếm món theo tên/tag, đợi 300ms sau lần gõ cuối mới gọi
  useEffect(() => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setResults([]);
      setSearchLoading(false);
      return undefined;
    }

    let active = true;
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc('search_menu', { keyword: trimmed });
      if (active) {
        setResults(data ?? []);
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [keyword]);

  const openStore = (storeId, storeName) => navigation.navigate('StoreMenu', { storeId, storeName });
  const openProduct = (productId) => navigation.navigate('ProductDetail', { productId });
  const openStoreList = (params) => navigation.navigate('StoreList', params);

  // category = null là ô "Tất cả"
  const openCategory = (category) =>
    openStoreList({
      title: category ? category.name : 'Tất cả cửa hàng',
      categoryId: category?.id ?? null,
    });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeHeader
        cartCount={count}
        onRefresh={refreshHome}
        onPressAddress={() =>
          Alert.alert('Sắp ra mắt', 'Chọn địa chỉ giao hàng sẽ làm ở bước thanh toán.')
        }
        onPressCart={() => navigation.navigate('Cart')}
      />

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm món ăn, quán ngon"
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
        />
        {keyword.length > 0 && (
          <TouchableOpacity onPress={() => setKeyword('')}>
            <Ionicons name="close-circle" size={20} color="#bbb" />
          </TouchableOpacity>
        )}
      </View>

      {isSearching ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.product_id}
          renderItem={({ item }) => (
            <SearchResultRow result={item} onPress={() => openStore(item.store_id, item.store_name)} />
          )}
          ListEmptyComponent={
            searchLoading ? (
              <ActivityIndicator style={styles.empty} color="#d32f2f" />
            ) : (
              <Text style={[styles.empty, styles.emptyText]}>Không tìm thấy món phù hợp</Text>
            )
          }
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        // Kéo xuống để tải lại (cử chỉ pull-to-refresh)
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={home.status === 'loading'}
              onRefresh={refreshHome}
              colors={['#d32f2f']}
            />
          }
        >
          <BannerCarousel banners={HOME_BANNERS} />
          <CategoryGrid categories={home.categories} onSelect={openCategory} />

          {home.newStores.length > 0 && (
            <SectionRow
              title="Cửa hàng mới"
              onSeeAll={() => openStoreList({ title: 'Cửa hàng mới', sort: 'newest' })}
            >
              {home.newStores.map((store) => (
                <StoreTile key={store.id} store={store} onPress={() => openStore(store.id, store.name)} />
              ))}
            </SectionRow>
          )}

          {home.singleMenu.length > 0 && (
            <SectionRow title="Menu 1 người">
              {home.singleMenu.map((product) => (
                <ProductTile key={product.id} product={product} onPress={() => openProduct(product.id)} />
              ))}
            </SectionRow>
          )}

          {home.popularProducts.length > 0 && (
            <SectionRow title="Món nổi bật">
              {home.popularProducts.map((product) => (
                <ProductTile key={product.id} product={product} onPress={() => openProduct(product.id)} />
              ))}
            </SectionRow>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  address: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  addressText: { fontSize: 16, fontWeight: '700', color: '#111', marginRight: 4, flexShrink: 1 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#d32f2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 8, fontSize: 15 },

  resultRow: { paddingHorizontal: 16, paddingVertical: 12 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#111' },
  resultStore: { fontSize: 13, color: '#888', marginTop: 3 },
  resultPrice: { fontSize: 15, fontWeight: '700', color: '#d32f2f', marginTop: 4 },

  empty: { marginTop: 40 },
  emptyText: { textAlign: 'center', color: '#888' },
});
