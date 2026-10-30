import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { formatPrice, formatRating } from '../lib/format';
import QuantityStepper from '../components/QuantityStepper';

const MAX_QUANTITY = 99;

const PRODUCT_COLUMNS = `
  id, name, description, image_url, base_price, rating_avg, rating_count, store_id,
  option_groups(id, name, min_select, max_select, sort_order,
    options(id, name, extra_price, is_available, sort_order))
`;

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

// Nhóm bắt buộc chọn đúng 1 (vd Kích cỡ) thì chọn sẵn lựa chọn đầu tiên
const isRequiredSingle = (group) => group.min_select === 1 && group.max_select === 1;

const defaultSelection = (groups) =>
  Object.fromEntries(
    groups.map((group) => [
      group.id,
      isRequiredSingle(group) && group.options.length > 0 ? [group.options[0].id] : [],
    ])
  );

const groupHint = (group) =>
  group.max_select === 1 ? 'Chọn 1' : `Chọn tối đa ${group.max_select}`;

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params;
  const { storeId, addItem, clearCart } = useCart();
  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('id', productId)
        .maybeSingle();

      if (data) {
        const groups = data.option_groups.sort(bySortOrder).map((group) => ({
          ...group,
          options: group.options.filter((option) => option.is_available).sort(bySortOrder),
        }));
        setProduct({ ...data, option_groups: groups });
        setSelected(defaultSelection(groups));
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const selectedOptions = useMemo(() => {
    if (!product) return [];
    return product.option_groups.flatMap((group) =>
      group.options.filter((option) => selected[group.id]?.includes(option.id))
    );
  }, [product, selected]);

  const unitPrice =
    Number(product?.base_price ?? 0) +
    selectedOptions.reduce((sum, option) => sum + Number(option.extra_price), 0);

  const missingRequired =
    product?.option_groups.some((group) => (selected[group.id]?.length ?? 0) < group.min_select) ??
    false;

  const toggleOption = (group, optionId) => {
    setSelected((previous) => {
      const current = previous[group.id];

      if (current.includes(optionId)) {
        // Nhóm bắt buộc chọn đúng 1 hoạt động như nút radio: không bỏ chọn được
        if (isRequiredSingle(group)) return previous;
        return { ...previous, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (group.max_select === 1) return { ...previous, [group.id]: [optionId] };
      if (current.length >= group.max_select) return previous;
      return { ...previous, [group.id]: [...current, optionId] };
    });
  };

  const addToCart = async () => {
    setAdding(true);
    const { error } = await addItem({
      product,
      quantity,
      optionIds: selectedOptions.map((option) => option.id),
    });
    setAdding(false);

    if (error) {
      Alert.alert('Không thêm được món', error.message);
      return;
    }
    Alert.alert('Đã thêm vào giỏ hàng', product.name, [
      { text: 'Tiếp tục chọn món', onPress: () => navigation.goBack() },
      { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('MainTabs', { screen: 'Cart' }) },
    ]);
  };

  const handleAddPress = () => {
    // Đơn hàng chỉ thuộc về 1 cửa hàng nên giỏ không được trộn món của nhiều quán
    if (storeId && storeId !== product.store_id) {
      Alert.alert(
        'Đổi cửa hàng?',
        'Giỏ hàng đang có món của cửa hàng khác. Xóa giỏ hàng cũ để thêm món này?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa và thêm',
            style: 'destructive',
            onPress: async () => {
              await clearCart();
              await addToCart();
            },
          },
        ]
      );
      return;
    }
    addToCart();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Món này hiện không còn bán</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="fast-food-outline" size={64} color="#d32f2f" />
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.meta}>{formatRating(product.rating_avg, product.rating_count)}</Text>
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
          <Text style={styles.price}>{formatPrice(product.base_price)}</Text>
        </View>

        {product.option_groups.map((group) => {
          const isSingle = group.max_select === 1;
          const reachedMax = !isSingle && selected[group.id].length >= group.max_select;

          return (
            <View key={group.id} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupHint}>
                  {group.min_select >= 1 ? 'Bắt buộc · ' : ''}
                  {groupHint(group)}
                </Text>
              </View>

              {group.options.map((option) => {
                const isSelected = selected[group.id].includes(option.id);
                const disabled = reachedMax && !isSelected;
                const iconName = isSingle
                  ? isSelected ? 'radio-button-on' : 'radio-button-off'
                  : isSelected ? 'checkbox' : 'square-outline';

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionRow, disabled && styles.optionDisabled]}
                    onPress={() => toggleOption(group, option.id)}
                    disabled={disabled}
                  >
                    <Ionicons name={iconName} size={22} color={isSelected ? '#d32f2f' : '#bbb'} />
                    <Text style={styles.optionName}>{option.name}</Text>
                    {Number(option.extra_price) > 0 ? (
                      <Text style={styles.optionPrice}>+{formatPrice(option.extra_price)}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <QuantityStepper
          value={quantity}
          onChange={(next) => setQuantity(Math.max(1, Math.min(MAX_QUANTITY, next)))}
        />
        <TouchableOpacity
          style={[styles.addButton, (missingRequired || adding) && styles.addButtonDisabled]}
          onPress={handleAddPress}
          disabled={missingRequired || adding}
        >
          <Text style={styles.addButtonText}>
            {adding ? 'Đang thêm...' : `Thêm vào giỏ · ${formatPrice(unitPrice * quantity)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  notFound: { fontSize: 15, color: '#888' },

  image: { width: '100%', height: 260 },
  imagePlaceholder: { backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },

  body: { padding: 16, borderBottomWidth: 8, borderBottomColor: '#f5f5f5' },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  meta: { fontSize: 13, color: '#888', marginTop: 4 },
  description: { fontSize: 14, color: '#555', marginTop: 8 },
  price: { fontSize: 20, fontWeight: '700', color: '#d32f2f', marginTop: 10 },

  group: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 8, borderBottomColor: '#f5f5f5' },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  groupName: { fontSize: 16, fontWeight: '700', color: '#111' },
  groupHint: { fontSize: 12, color: '#888' },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  optionDisabled: { opacity: 0.4 },
  optionName: { flex: 1, fontSize: 15, color: '#222', marginLeft: 12 },
  optionPrice: { fontSize: 14, color: '#888' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 16,
  },
  addButtonDisabled: { backgroundColor: '#f2a3a3' },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
