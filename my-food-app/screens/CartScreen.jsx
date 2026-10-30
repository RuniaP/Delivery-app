import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../lib/format';
import QuantityStepper from '../components/QuantityStepper';

const MAX_QUANTITY = 99;

function CartItemRow({ item, onChangeQuantity, onRemove }) {
  const optionsText = item.options.map((option) => option.name).join(', ');

  // Cử chỉ: vuốt dòng món sang trái để hiện nút Xóa
  const renderDeleteAction = () => (
    <TouchableOpacity style={styles.deleteAction} onPress={onRemove}>
      <Ionicons name="trash" size={22} color="#fff" />
      <Text style={styles.deleteText}>Xóa</Text>
    </TouchableOpacity>
  );

  return (
    <ReanimatedSwipeable
      renderRightActions={renderDeleteAction}
      overshootRight={false}
      friction={2}
    >
    <View style={styles.row}>
      {item.product.image_url ? (
        <Image source={{ uri: item.product.image_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="fast-food-outline" size={26} color="#d32f2f" />
        </View>
      )}
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        {optionsText ? <Text style={styles.itemOptions} numberOfLines={2}>{optionsText}</Text> : null}
        <View style={styles.rowBottom}>
          <Text style={styles.itemPrice}>{formatPrice(item.unitPrice * item.quantity)}</Text>
          <QuantityStepper value={item.quantity} onChange={onChangeQuantity} />
        </View>
      </View>
    </View>
    </ReanimatedSwipeable>
  );
}

export default function CartScreen({ navigation }) {
  const { items, loading, subtotal, changeQuantity, removeItem } = useCart();

  const run = async (action) => {
    const { error } = await action();
    if (error) Alert.alert('Có lỗi xảy ra', error.message);
  };

  const handleCheckout = () =>
    Alert.alert('Sắp ra mắt', 'Bước thanh toán (địa chỉ giao hàng, mã QR chuyển khoản) sẽ làm ở bước tiếp theo.');

  const renderBody = () => {
    if (loading && items.length === 0) {
      return <ActivityIndicator style={styles.centerContent} color="#d32f2f" />;
    }

    if (items.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.emptyButtonText}>Chọn món ngay</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onChangeQuantity={(quantity) =>
              run(() => changeQuantity(item.id, Math.min(MAX_QUANTITY, quantity)))
            }
            onRemove={() => run(() => removeItem(item.id))}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Giỏ hàng</Text>
      {renderBody()}

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng tiền hàng</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <Text style={styles.summaryNote}>Phí giao hàng và giảm giá được tính ở bước thanh toán.</Text>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#111', paddingHorizontal: 16, paddingVertical: 14 },
  listContent: { paddingBottom: 16 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  deleteAction: {
    width: 84,
    backgroundColor: '#d32f2f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 2 },
  thumb: { width: 72, height: 72, borderRadius: 12, marginRight: 12 },
  thumbPlaceholder: { backgroundColor: '#fde8e8', alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111', marginRight: 8 },
  itemOptions: { fontSize: 13, color: '#888', marginTop: 3 },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#d32f2f' },

  emptyTitle: { fontSize: 16, color: '#888', marginTop: 12 },
  emptyButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  emptyButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 15, color: '#555' },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#111' },
  summaryNote: { fontSize: 12, color: '#999', marginTop: 4 },
  checkoutButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 14,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
