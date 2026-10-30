import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  Switch,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/format';
import SectionHeader from '../components/SectionHeader';

const NO_SECTION_TITLE = 'Chưa xếp mục';

function ManageProductRow({ product, onPress, onToggleAvailable }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="fast-food-outline" size={26} color="#d32f2f" />
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.base_price)}</Text>
      </View>
      <View style={styles.switchBox}>
        <Switch
          value={product.is_available}
          onValueChange={onToggleAvailable}
          trackColor={{ true: '#f2a3a3' }}
          thumbColor={product.is_available ? '#d32f2f' : '#f4f3f4'}
        />
        <Text style={styles.switchLabel}>{product.is_available ? 'Còn bán' : 'Hết món'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MoveButtons({ canMoveUp, canMoveDown, onMove }) {
  return (
    <View style={styles.moveButtons}>
      <TouchableOpacity
        onPress={() => onMove(-1)}
        disabled={!canMoveUp}
        hitSlop={8}
        style={!canMoveUp && styles.moveDisabled}
      >
        <Ionicons name="chevron-up-circle-outline" size={28} color="#555" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onMove(1)}
        disabled={!canMoveDown}
        hitSlop={8}
        style={!canMoveDown && styles.moveDisabled}
      >
        <Ionicons name="chevron-down-circle-outline" size={28} color="#555" />
      </TouchableOpacity>
    </View>
  );
}

export default function ManageMenuScreen({ navigation }) {
  const { profile } = useAuth();
  const storeId = profile.store_id;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(storeId));

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, image_url, base_price, is_available, section:menu_sections(id, name, sort_order)')
      .eq('store_id', storeId)
      .order('name');
    setProducts(data ?? []);
    setLoading(false);
  }, [storeId]);

  // Tải lại mỗi lần quay về tab này, để thấy ngay món vừa thêm/sửa
  useFocusEffect(
    useCallback(() => {
      if (storeId) loadProducts();
    }, [storeId, loadProducts])
  );

  // Gom món theo mục của cửa hàng; món chưa có mục nằm cuối
  const sections = useMemo(() => {
    const groups = new Map();
    products.forEach((product) => {
      const key = product.section?.id ?? 'none';
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          id: product.section?.id ?? null,
          title: product.section?.name ?? NO_SECTION_TITLE,
          order: product.section?.sort_order ?? Number.MAX_SAFE_INTEGER,
          data: [],
        });
      }
      groups.get(key).data.push(product);
    });
    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }, [products]);

  const realSectionIds = sections.filter((section) => section.id).map((section) => section.id);

  const moveSection = async (sectionId, direction) => {
    const { error } = await supabase.rpc('move_menu_section', {
      p_section_id: sectionId,
      p_direction: direction,
    });
    if (error) {
      Alert.alert('Không đổi được thứ tự', error.message);
      return;
    }
    await loadProducts();
  };

  const setAvailable = (productId, value) =>
    setProducts((previous) =>
      previous.map((product) =>
        product.id === productId ? { ...product, is_available: value } : product
      )
    );

  // Cập nhật giao diện ngay, lỗi thì trả về trạng thái cũ
  const toggleAvailable = async (product, value) => {
    setAvailable(product.id, value);
    const { error } = await supabase
      .from('products')
      .update({ is_available: value })
      .eq('id', product.id);
    if (error) {
      setAvailable(product.id, !value);
      Alert.alert('Không cập nhật được', error.message);
    }
  };

  if (!storeId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Tài khoản chưa được gán cửa hàng. Vui lòng liên hệ admin.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý món</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ProductForm')}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Thêm món</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.center} color="#d32f2f" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ManageProductRow
              product={item}
              onPress={() => navigation.navigate('ProductForm', { productId: item.id })}
              onToggleAvailable={(value) => toggleAvailable(item, value)}
            />
          )}
          renderSectionHeader={({ section }) => {
            const position = realSectionIds.indexOf(section.id);
            return (
              <SectionHeader title={section.title} count={section.data.length}>
                {section.id ? (
                  <MoveButtons
                    canMoveUp={position > 0}
                    canMoveDown={position < realSectionIds.length - 1}
                    onMove={(direction) => moveSection(section.id, direction)}
                  />
                ) : null}
              </SectionHeader>
            );
          }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, styles.emptyList]}>
              Chưa có món nào. Bấm “Thêm món” để bắt đầu.
            </Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  listContent: { paddingBottom: 24 },

  moveButtons: { flexDirection: 'row' },
  moveDisabled: { opacity: 0.25 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  thumb: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },
  thumbPlaceholder: { backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#222' },
  price: { fontSize: 14, fontWeight: '700', color: '#d32f2f', marginTop: 4 },
  switchBox: { alignItems: 'center', marginLeft: 8 },
  switchLabel: { fontSize: 11, color: '#888' },

  emptyText: { textAlign: 'center', color: '#888' },
  emptyList: { marginTop: 40 },
});
